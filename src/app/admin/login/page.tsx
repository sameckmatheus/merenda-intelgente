
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Logo className="h-24 w-24" />
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground">
          MenuPlanner - Acesso Restrito
        </h1>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert /> Área do Administrador
          </CardTitle>
          <CardDescription>
            Use seu e-mail e senha de administrador para acessar o dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoginPageSkeleton />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
