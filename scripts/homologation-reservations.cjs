// Integração SQLite real -> API local -> PostgreSQL para reservas por estação.
// Usa o perfil sintético do harness e nunca deve apontar para produção.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { OfflineStore } = require('../electron/offlineStore');

(async () => {
  const base = process.env.HOMOLOGATION_API || 'http://127.0.0.1:3010';
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const context = JSON.parse(fs.readFileSync(process.env.HOMOLOGATION_CONTEXT || '/tmp/opencode/homologation-context.json', 'utf8'));
  assert.match(context.username, /^qa\./, 'Use somente o perfil sintético do harness.');
  const output = process.env.HOMOLOGATION_OUTPUT || '/tmp/opencode';
  const directory = fs.mkdtempSync(path.join(output, 'reservations-e2e-'));
  const filename = path.join(directory, 'local.sqlite');
  const key = randomBytes(32);
  const installation = randomUUID();
  const results = [];
  let store = null;
  let token = null;
  let stationToken = null;
  let product = null;
  let customerId = null;
  let scope = null;
  let now = Date.now();

  const check = (name, condition) => {
    assert.ok(condition, name);
    results.push({ name, status: 'Aprovado' });
    console.log('PASS', name);
  };

  const request = async (method, route, body, expected = 200, options = {}) => {
    const entityId = options.entityId === undefined ? context.legalEntityId : options.entityId;
    const headers = {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(stationToken ? { 'x-station-token': stationToken } : {}),
      ...(entityId ? { 'x-legal-entity-id': String(entityId) } : {}),
      ...(options.headers || {}),
    };
    const response = await fetch(base + route, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json();
    // Nunca imprimir o corpo inteiro: a resposta de criação contém o token de
    // posse da reserva, que não pode vazar para logs de homologação.
    const summary = data && typeof data === 'object'
      ? [data.code, data.error, data.message].filter(Boolean).join(' - ')
      : '';
    assert.equal(response.status, expected, `${method} ${route}: HTTP ${response.status}${summary ? ` (${summary})` : ''}`);
    return data;
  };

  const login = async (pairedStationToken = null) => {
    const response = await fetch(base + '/login/auth-employee', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(pairedStationToken ? { 'x-station-token': pairedStationToken } : {}),
      },
      body: JSON.stringify({ username: context.username, password: context.password }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json();
    assert.equal(response.status, 200, JSON.stringify(data));
    return data;
  };

  // Reautenticação real: a primeira tentativa recebe 403 com a operação
  // vinculada; a concessão é criada com a senha e consumida na repetição.
  const withReauth = async (method, route, body, expected = 200, options = {}) => {
    const denied = await request(method, route, body, 403, options);
    assert.equal(denied.code, 'REAUTH_REQUIRED');
    const grant = await request('POST', '/audit/reauth', {
      password: context.password,
      intent: denied.reauth,
      payload: body ?? null,
    }, 201);
    assert.equal(grant.success, true);
    return request(method, route, body, expected, {
      ...options,
      headers: { ...(options.headers || {}), 'x-reauth-grant': grant.grantId },
    });
  };

  const createReservation = async (quantity) => {
    const body = { items: [{ productId: product.id, quantity }], ttlMinutes: 120 };
    const created = await withReauth('POST', '/orders/reservations', body, 201);
    assert.equal(created.success, true);
    assert.match(created.data.reservationToken, /^[A-Za-z0-9_-]{20,256}$/);
    return created.data;
  };

  const stockOf = async () => {
    const response = await request('GET', `/products/${product.id}`);
    return { stock: Number(response.product.stock), reserved: Number(response.product.reserved || 0) };
  };

  const localReservation = (reservation) => ({
    id: reservation.id,
    reservationToken: reservation.reservationToken,
    deviceId: reservation.deviceId,
    deviceName: reservation.deviceName,
    expiresAt: reservation.expiresAt,
    items: reservation.items,
    status: reservation.status,
  });

  const orderPayload = (reservation, operationId, quantity) => ({
    orderDate: new Date().toISOString().slice(0, 10),
    // O cliente tenta aprovar e numerar; o servidor deve ignorar ambos.
    orderStatus: 'approved',
    orderNumber: 'P-CLIENTE',
    customerId,
    totalAmount: quantity * product.price,
    currency: 'BRL',
    salesperson: 'QA',
    carrier: 'QA',
    payment_method: 'pix',
    notes: `Homologação reservas ${operationId}`,
    orderItems: [{
      productId: product.id,
      quantity,
      unitPrice: product.price,
      ...(product.location ? { location: product.location } : {}),
    }],
    clientRequestId: operationId,
    reservationId: reservation.id,
  });

  const queueAndClaim = (reservation, operationId, quantity) => {
    store.queueOrder(scope, 'new', orderPayload(reservation, operationId, quantity), reservation.id, operationId, null);
    const claimed = store.claimOrders(scope);
    assert.equal(claimed.length, 1);
    return claimed[0];
  };

  const submit = (operation) => request('POST', '/orders/offline-create', {
    ...operation.payload,
    reservationId: operation.reservationId,
    reservationToken: operation.reservationToken,
  }, 201);

  try {
    const initial = await login();
    token = initial.token;

    const station = await withReauth('POST', '/audit/stations', {
      name: `QA Reservas ${Date.now()}`,
      sector: 'Homologação',
    }, 201);
    const pairing = await withReauth('POST', `/audit/stations/${station.data.id}/pairing`, {
      label: 'Homologação SQLite reservas',
    }, 201);
    stationToken = pairing.data.code;

    const paired = await login(stationToken);
    assert.equal(paired.station?.id, station.data.id);
    token = paired.token;
    scope = {
      companyId: context.companyId,
      legalEntityId: context.legalEntityId,
      userId: Number(paired.user.id),
    };

    const products = await request('GET', '/products/all');
    product = products.products.find((item) =>
      Number(item.stock) - Number(item.reserved || 0) >= 2 && item.available !== false
    );
    assert.ok(product, 'o contexto QA precisa de produto com saldo livre');
    product = {
      id: Number(product.id),
      price: Number(product.price || 0),
      location: product.location || null,
    };
    const customers = await request('GET', '/orders/customers/list');
    customerId = Number(customers.customers?.[0]?.id);
    assert.ok(Number.isSafeInteger(customerId) && customerId > 0, 'o contexto QA precisa de cliente');

    store = new OfflineStore(filename, key, installation, { now: () => now });

    // 1. Reserva criada online com reautenticação, gravada cifrada no SQLite.
    const before = await stockOf();
    const reservation = await createReservation(2);
    const saved = store.saveReservation(scope, 'new', localReservation(reservation));
    check('reserva online é gravada no SQLite vinculada à estação', saved.id === reservation.id && saved.deviceId === reservation.deviceId && saved.status === 'active');
    check('reserva incrementa reserved sem baixar o saldo físico', (await stockOf()).reserved === before.reserved + 2 && (await stockOf()).stock === before.stock);

    const operationId = randomUUID();
    const operation = queueAndClaim(reservation, operationId, 2);
    const pending = store.loadReservation(scope, 'new');
    check('pedido reservado entra na fila local imutável', pending.status === 'queued' && operation.payload.clientRequestId === operationId);

    const created = await submit(operation);
    check('servidor atribui número P- e força status pendente', /^P-\d+$/.test(created.orderNumber) && Number(created.orderNumber.slice(2)) >= 100 && created.orderStatus === 'pending');
    check('consumo exato confirma a reserva e baixa o estoque uma vez', created.stockReservationId === reservation.id && (await stockOf()).stock === before.stock - 2 && (await stockOf()).reserved === before.reserved);

    const ack = store.acknowledgeOrder(scope, operation.operationId, operation.leaseToken, {
      orderId: Number(created.id),
      orderNumber: created.orderNumber,
      reservationId: created.stockReservationId,
    });
    check('ACK exato marca o pedido como confirmado e consome a reserva local', ack.confirmed && store.stats(scope).orders.confirmed === 1 && store.stats(scope).reservations.consumed === 1);

    // 2. Resposta perdida: o mesmo UUID e o mesmo conteúdo não podem duplicar.
    const lost = await createReservation(2);
    store.saveReservation(scope, 'new', localReservation(lost));
    const lostOperationId = randomUUID();
    const lostOperation = queueAndClaim(lost, lostOperationId, 2);
    const firstSend = await submit(lostOperation);
    const afterFirstSend = await stockOf();

    store.close();
    now += 61000;
    store = new OfflineStore(filename, key, installation, { now: () => now });
    const replayOperation = store.claimOrders(scope)[0];
    assert.ok(replayOperation, 'o lease vencido deve ser recuperado após reinício');
    const replay = await submit(replayOperation);
    const afterReplay = await stockOf();
    check('reconexão reenvia a mesma operação sem duplicar pedido', replay.id === firstSend.id && replay.orderNumber === firstSend.orderNumber);
    check('replay não baixa estoque nem libera reserved novamente', afterReplay.stock === afterFirstSend.stock && afterReplay.reserved === afterFirstSend.reserved);
    await request('POST', '/orders/offline-create', {
      ...replayOperation.payload,
      reservationId: replayOperation.reservationId,
      reservationToken: replayOperation.reservationToken,
      notes: 'conteúdo divergente',
    }, 409);
    check('mesmo UUID com conteúdo divergente é rejeitado', (await stockOf()).stock === afterReplay.stock);

    const replayAck = store.acknowledgeOrder(scope, replayOperation.operationId, replayOperation.leaseToken, {
      orderId: Number(replay.id),
      orderNumber: replay.orderNumber,
      reservationId: replay.stockReservationId,
    });
    check('ACK recuperado após reinício encerra a fila local', replayAck.confirmed && store.stats(scope).orders.confirmed === 2 && store.stats(scope).reservations.consumed === 2);

    const files = fs.readdirSync(directory).filter((name) => name.startsWith(path.basename(filename)));
    const tokenBytes = Buffer.from(reservation.reservationToken);
    check('prova de posse não aparece em texto aberto nos arquivos SQLite', files.every((name) => !fs.readFileSync(path.join(directory, name)).includes(tokenBytes)));
  } catch (error) {
    results.push({ status: 'Reprovado', error: error.message });
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (store) store.close();
    key.fill(0);
    fs.writeFileSync(path.join(output, 'sqlite-reservations.json'), JSON.stringify({
      scope: 'SQLite real -> API local -> PostgreSQL; perfil QA sintético; estação e reautenticação reais; perda de ACK e reinício injetados.',
      environment: { api: base, database: 'PostgreSQL local (konexus_e2e)' },
      results,
    }, null, 2));
  }
})();
