import { Link } from 'react-router-dom'
import Dashboard from '../../../components/dashboard'

const CadColaboradores = () => {
    return (

        <Dashboard>
            <div>
                <div>
                    <div>
                        <div className="title-and-back">
                            <h3>Cadastro de Colaboradores</h3>
                            <Link to="/initialpage">Voltar ao menu</Link>
                        </div>
                        <div>
                            <form>
                                <div className="numbers-type">
                                    <label htmlFor="id-colaborador">Id:</label>
                                    <input className="num-type" type="number" />
                                </div>
                                <div>
                                    <label htmlFor="name-colaborador">Nome:</label>
                                    <input type="text" />
                                </div>
                                <div>
                                    <label htmlFor="email-colaborador">Email:</label>
                                    <input type="email" />
                                </div>
                                <div className="numbers-type">
                                    <label htmlFor="tel-colaborador">Tel:</label>
                                    <input className="num-type-tel" type="number" />
                                </div>
                                <div>
                                    <h3>Credenciais de Acesso</h3>
                                    <div>
                                        <label htmlFor="username-colaborador">Username Login:</label>
                                        <input type="text" />
                                    </div>
                                    <div>
                                        <label htmlFor="pass-colaborador">Senha:</label>
                                        <input type="text" />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>

    )
}

export default CadColaboradores