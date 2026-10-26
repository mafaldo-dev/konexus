import {downloadTrainingCertificate} from './trainingService';

let mockPdfOutput = '';
let mockFilename = '';
jest.mock('../api/client', () => ({apiClient: {get: jest.fn()}}));
jest.mock('jspdf', () => {
  const {TextEncoder,TextDecoder} = jest.requireActual('node:util');
  Object.assign(globalThis, {TextEncoder,TextDecoder});
  const actual = jest.requireActual('jspdf');
  return {jsPDF: function () {
    const document = new actual.jsPDF();
    document.save = (filename: string) => {
      mockPdfOutput = document.output();
      mockFilename = filename;
      return document;
    };
    return document;
  }};
});

it('gera um PDF real do snapshot emitido, preservando código e nota zero', async () => {
  const certificate = {id:42,code:'CERT-IMUTAVEL-42',issued_at:'2026-10-26T12:00:00Z',snapshot:{
    employerLegalName:'Empresa do snapshot',employerCnpj:'11222333000181',contributorName:'Participante preservado',
    trainingTitle:'Curso preservado',modality:'online',workloadHours:4,grade:0,
    startsAt:'2026-10-25T12:00:00Z',endsAt:'2026-10-26T12:00:00Z',completedAt:'2026-10-26T12:00:00Z',
  }};
  const before = JSON.stringify(certificate);
  await downloadTrainingCertificate(certificate);
  expect(mockFilename).toBe('certificado-42.pdf');
  expect(mockPdfOutput).toMatch(/^%PDF-/);
  expect(mockPdfOutput).toContain('CERT-IMUTAVEL-42');
  expect(mockPdfOutput).toContain('Curso preservado');
  expect(mockPdfOutput).toContain('Nota: 0');
  expect(JSON.stringify(certificate)).toBe(before);
});
