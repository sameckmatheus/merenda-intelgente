
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, LogIn, LoaderCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando...',
        });
        const nextUrl = searchParams.get('next') || '/admin';
        router.push(nextUrl);
        router.refresh(); // Important to re-trigger middleware and get new server state
      } else {
        const errorData = await response.json();
        toast({
          variant: 'destructive',
          title: 'Falha no Login',
          description:
            errorData.message || 'Credenciais inválidas. Tente novamente.',
        });
      }
    } catch (error: any) {
      let errorMessage = 'Não foi possível conectar ao servidor.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'E-mail ou senha incorretos.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'O formato do e-mail é inválido.';
            break;
          default:
            errorMessage = 'Ocorreu um erro durante o login.';
        }
      }
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">E-mail</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    className="pl-10 h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-blue-500 transition-all hover:bg-white"
                    {...field}
                  />
                </FormControl>
                <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none">
                  <KeyRound className="w-5 h-5" />
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Senha</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    className="pl-10 h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-blue-500 transition-all hover:bg-white"
                    {...field}
                  />
                </FormControl>
                <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 text-md font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isLoading}>
          {isLoading ? (
            <LoaderCircle className="animate-spin mr-2" />
          ) : (
            <>
              <LogIn className="mr-2 w-5 h-5" />
              Entrar na Plataforma
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
