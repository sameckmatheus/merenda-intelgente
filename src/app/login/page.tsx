
import { Suspense } from 'react';
import { School } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/logo';
import LoginForm from '@/app/login/login-form';

function LoginPageSkeleton() {
    return <div>Loading...</div>;
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6">
            <div className="mb-10 flex flex-col items-center gap-6 text-center">
                <div className="bg-white/40 p-4 rounded-3xl backdrop-blur-xl shadow-xl shadow-indigo-900/5 border border-white/50">
                    <Logo className="h-28 w-28" />
                </div>
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-indigo-950">
                        Acesso Escolar
                    </h1>
                    <p className="text-indigo-600/80 font-medium">Smart Plate</p>
                </div>
            </div>
            <Card className="w-full max-w-sm rounded-3xl border-0 bg-white/60 shadow-2xl shadow-indigo-900/10 backdrop-blur-md ring-1 ring-white/60 transition-all">
                <CardHeader className="space-y-1 pb-2 text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-xl text-slate-800">
                        <School className="w-5 h-5 text-indigo-600" /> Identifique-se
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-sm">
                        Insira o e-mail e senha da sua unidade escolar
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <Suspense fallback={<LoginPageSkeleton />}>
                        <LoginForm />
                    </Suspense>
                </CardContent>
            </Card>

            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 mb-2">Acesso administrativo?</p>
                <a
                    href="/admin/login"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm underline decoration-2 underline-offset-4 transition-colors"
                >
                    Acessar como Administrador
                </a>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
                © {new Date().getFullYear()} Secretaria de Educação. Todos os direitos reservados.
            </p>
        </div>
    );
}
