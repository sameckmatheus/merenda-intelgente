
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, LogIn, LoaderCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
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
// import { isSchoolEmail } from '@/lib/school-auth'; // Removed due to missing file

const loginSchema = z.object({
    email: z.string().email('E-mail inválido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    async function onSubmit(data: z.infer<typeof loginSchema>) {
        setIsLoading(true);

        /*
        // Client-side check for expected school email format validation
        // Removed because isSchoolEmail is missing
        if (!isSchoolEmail(data.email)) {
            toast({
                variant: 'destructive',
                title: 'Acesso Restrito',
                description: 'Este e-mail não pertence a uma unidade escolar cadastrada.',
            });
            setIsLoading(false);
            return;
        }
        */

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
                const data = await response.json();
                const role = data.role;

                let targetUrl = '/escola'; // Default fallback

                if (role === 'admin') {
                    targetUrl = '/admin';
                } else if (role === 'school') {
                    targetUrl = '/escola';
                }

                // Check for 'next' param overrides
                const nextParam = searchParams.get('next');
                if (nextParam) {
                    if (targetUrl === '/admin' && nextParam.startsWith('/escola')) {
                        // admin trying to go to school page -> redirect to admin
                    } else if (targetUrl === '/escola' && nextParam.startsWith('/admin')) {
                        // school trying to go to admin -> redirect to school
                    } else {
                        targetUrl = nextParam;
                    }
                }

                toast({
                    title: 'Login bem-sucedido!',
                    description: `Redirecionando para ${targetUrl === '/admin' ? 'Painel Administrativo' : 'Painel da Escola'}...`,
                });

                router.push(targetUrl);
                router.refresh();
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
            console.error('Login error details:', error);
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
                    case 'auth/too-many-requests':
                        errorMessage = 'Muitas tentativas falhas. Tente novamente mais tarde.';
                        break;
                    default:
                        errorMessage = `Erro (${error.code}): ${error.message}`;
                }
            } else {
                errorMessage = `Erro inesperado: ${error.message || 'Consulte o console'}`;
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
                                        className="pl-10 h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-indigo-500 transition-all hover:bg-white"
                                        placeholder="E-mail da Escola"
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
                                        type={showPassword ? 'text' : 'password'}
                                        className="pl-10 h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-indigo-500 transition-all hover:bg-white pr-10"
                                        placeholder="Senha de Acesso"
                                        {...field}
                                    />
                                </FormControl>
                                <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/20 text-md font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isLoading}>
                    {isLoading ? (
                        <LoaderCircle className="animate-spin mr-2" />
                    ) : (
                        <>
                            <LogIn className="mr-2 w-5 h-5" />
                            Entrar
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}
