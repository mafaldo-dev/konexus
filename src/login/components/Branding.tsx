import logo from "../../assets/image/guiman.png";

export default function Branding() {
    return (
        <div className="w-1/2 bg-slate-900 text-white flex flex-col items-center justify-center p-8">
            <img src={logo} alt="Logo" className="w-92 h-82 mb-4" />
            <h1 className="text-4xl font-bold text-slate-300">Technology that matters.</h1>
        </div>
    );
}