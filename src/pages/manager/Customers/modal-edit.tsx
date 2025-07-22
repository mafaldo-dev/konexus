import { useForm, SubmitHandler } from 'react-hook-form'
import { Customer } from '../../../service/interfaces'

const EditClient = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<Customer>()

    const onSubmit: SubmitHandler<Customer> = async (data) => {
       
    }
    return (
        <div className="modal">
            <div className="flex mt-42 items-center justify-center m-auto bg-opacity-50 w-screen">
                <div className="bg-gray-100 p-6 rounded-lg shadow-lg w-9/12">
                    <h2 className="text-xl text-center font-bold mb-4">informações de contato</h2>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className='flex gap-2'>
                            <div className='w-full'>
                                <input
                                    type="text"
                                    {...register("name", { required: true })}
                                    placeholder="Nome"
                                    className="w-full border p-2 mb-2 rounded"
                                />
                                {errors.name && <span className="text-red-500 text-xs font-medium">Nome é obrigatório</span>}
                            </div>
                            <div className='w-full'>
                                <input
                                    type="text"
                                    {...register("email", { required: true })}
                                    placeholder="E-mail"
                                    className="w-full border p-2 mb-2 rounded"
                                />
                            </div>
                            <div className='w-full'>
                                <input
                                    type="text"
                                    {...register("phone", { required: true })}
                                    placeholder="Telefone"
                                    className="w-full border p-2 mb-2 rounded"
                                />
                                {errors.phone && <span className="text-red-500 text-xs font-medium">Telenefone é obrigatório</span>}
                            </div>
                        </div>
                        <h3 className='p-2 text-center font-semibold font-xl'>Informações de Endereço:</h3>
                        <div className='flex gap-2 w-full'>
                            <div className='w-full flex'>
                                <input
                                    type="text"
                                    {...register("address.street", { required: true })}
                                    placeholder="Endereço"
                                    className="w-full border p-2 mb-2 rounded"
                                />
                                {errors.address?.street && <span className="text-red-500 text-xs font-medium">Insira uma rua</span>}
                            </div>
                            <div className='w-2/12 flex justify-end'>
                                <input
                                    type="text"
                                    {...register("address.number", { required: true })}
                                    placeholder='Num'
                                    className='w-full border p-2  mb-2 rounded'
                                />
                                {errors.address?.number && <span className="text-red-500 text-xs font-medium">Insira uma numero</span>}
                            </div>
                        </div>
                        <div>
                            <input
                                type="text"
                                {...register("address.city", { required: true })}
                                placeholder="Cidade"
                                className="w-full border p-2 mb-2 rounded"
                            />
                            {errors.address?.city && <span className="text-red-500 text-xs font-medium">Insira uma  cidade</span>}
                        </div>
                        <div>
                            <input
                                type="text"
                                {...register("address.state", { required: true })}
                                placeholder="Estado"
                                className="w-full border p-2 mb-2 rounded"
                            />
                            {errors.address?.state && <span className="text-red-500 text-xs font-medium">Insira uma estado</span>}
                        </div>
                        <div>
                            <input
                                type="text"
                                {...register("address.zip_code", { required: true })}
                                placeholder="Codigo postal"
                                className="w-full border p-2 mb-2 rounded"
                            />
                            {errors.address?.zip_code && <span className="text-red-500 text-xs font-medium">Insira uma CEP</span>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default EditClient