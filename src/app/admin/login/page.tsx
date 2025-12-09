
import { Suspense } from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/logo';
import LoginForm from './login-form';

function LoginPageSkeleton() {
  return <div>Loading...</div>;
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="mb-10 flex flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-top-6 duration-700">
        <div className="bg-white/40 p-4 rounded-3xl backdrop-blur-xl shadow-xl shadow-blue-900/5 border border-white/50">
          <Logo className="h-28 w-28" />
        </div>
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-blue-950">
            Acesso Administrativo
          </h1>
          <p className="text-blue-600/80 font-medium">MenuPlanner</p>
        </div>
      </div>
      <Card className="w-full max-w-sm rounded-3xl border-0 bg-white/60 shadow-2xl shadow-blue-900/10 backdrop-blur-md ring-1 ring-white/60 animate-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 pb-2 text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl text-slate-800">
            <ShieldAlert className="w-5 h-5 text-blue-600" /> Identifique-se
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Insira suas credenciais de gestão para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Suspense fallback={<LoginPageSkeleton />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Secretaria de Educação. Todos os direitos reservados.
      </p>
    </div>
  );
}
