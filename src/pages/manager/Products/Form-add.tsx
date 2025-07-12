import { SubmitHandler, useForm } from "react-hook-form"
import { Products } from "../../../service/interfaces"
import { getAllProducts, insertProductComKardex } from "../../../service/api/Administrador/products"
import { useState } from "react"

export default function FormAdd() {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<Products>()
    const [openRegister, setOpenRegister] = useState<boolean>(false)

    const onSubmit: SubmitHandler<Products> = async (data) => {
        try {
            const productData = { ...data, addedAt: new Date() };
            delete productData.id;

            await insertProductComKardex(productData as Products);

            reset();
            await getAllProducts();

            alert("Produto adicionado com sucesso!");
            setOpenRegister(false);
        } catch (error: any) {
            alert(error.message || "Erro ao adicionar novo produto.");
        }
    };


    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col">
                    <label className="font-semibold">Nome</label>
                    <input
                        type="text"
                        {...register("name", { required: true })}
                        className="input-style border border-gray-200"
                    />
                    {errors.name && <span className="text-red-500 text-sm">Nome obrigatório</span>}
                </div>

                <div className="flex flex-col">
                    <label className="font-semibold">Código</label>
                    <input
                        type="text"
                        {...register("code", { required: true })}
                        className="input-style border border-gray-200"
                    />
                    {errors.code && <span className="text-red-500 text-sm">Código obrigatório</span>}
                </div>

                <div className="flex flex-col">
                    <label className="font-semibold">Quantidade</label>
                    <input
                        type="number"
                        {...register("quantity", { required: true })}
                        className="input-style border border-gray-200"
                    />
                    {errors.quantity && <span className="text-red-500 text-sm">Obrigatório</span>}
                </div>

                <div className="flex flex-col">
                    <label className="font-semibold">Preço</label>
                    <input
                        type="number"
                        step="0.01"
                        {...register("price", { required: true })}
                        className="input-style border border-gray-200"
                    />
                    {errors.price && <span className="text-red-500 text-sm">Obrigatório</span>}
                </div>

                <div className="flex flex-col">
                    <label className="font-semibold">Fornecedor</label>
                    <input
                        type="text"
                        {...register("supplier", { required: true })}
                        className="input-style border border-gray-200"
                    />
                    {errors.supplier && <span className="text-red-500 text-sm">Obrigatório</span>}
                </div>

                <div className="flex flex-col">
                    <label className="font-semibold">Localização</label>
                    <input
                        type="text"
                        {...register("location", { required: true })}
                        className="input-style border border-gray-200"
                    />
                    {errors.location && <span className="text-red-500 text-sm">Obrigatório</span>}
                </div>

                <div className="flex flex-col">
                    <label className="font-semibold">Estoque Mínimo</label>
                    <input
                        type="number"
                        {...register("minimum_stock", { required: true })}
                        className="input-style border border-gray-200"
                    />
                    {errors.minimum_stock && <span className="text-red-500 text-sm">Obrigatório</span>}
                </div>

                <div className="flex flex-col">
                    <label className="font-semibold">Marca</label>
                    <input
                        type="text"
                        {...register("brand", { required: true })}
                        className="input-style border border-gray-200"
                    />
                    {errors.brand && <span className="text-red-500 text-sm">Obrigatório</span>}
                </div>

                <div className="flex flex-col">
                    <label className="font-semibold">Categoria</label>
                    <input
                        type="text"
                        {...register("category", { required: true })}
                        className="input-style border border-gray-200"
                    />
                    {errors.category && <span className="text-red-500 text-sm">Obrigatório</span>}
                </div>
            </div>

            <div className="flex flex-col mb-6">
                <label className="font-semibold">Descrição</label>
                <textarea
                    {...register("description", { required: true })}
                    className="input-style border border-gray-200 min-h-[100px] resize-none"
                />
                {errors.description && <span className="text-red-500 text-sm">Obrigatória</span>}
            </div>

            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={() => setOpenRegister(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >Cancelar</button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >Salvar</button>
            </div>
        </form>
    )
}