import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { TrendingUp, Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Sun, Moon } from "lucide-react";

type AuthMode = "login" | "register";

interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

export function LoginPage() {
    const { loginWithGoogle, loginWithEmail, register, isLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Verifica se houve erro no callback do Google
    const urlParams = new URLSearchParams(window.location.search);
    const callbackError = urlParams.get("error");

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Validação de email
        if (!email.trim()) {
            newErrors.email = "Email é obrigatório";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Email inválido";
        } else if (!email.endsWith("@grupovorp.com")) {
            newErrors.email = "Apenas emails @grupovorp.com são permitidos";
        }

        // Validação de senha
        if (!password) {
            newErrors.password = "Senha é obrigatória";
        } else if (mode === "register") {
            if (password.length < 8) {
                newErrors.password = "A senha deve ter pelo menos 8 caracteres";
            } else if (!/[A-Z]/.test(password)) {
                newErrors.password = "A senha deve conter uma letra maiúscula";
            } else if (!/[a-z]/.test(password)) {
                newErrors.password = "A senha deve conter uma letra minúscula";
            } else if (!/[0-9]/.test(password)) {
                newErrors.password = "A senha deve conter um número";
            }
        }

        // Validações específicas para registro
        if (mode === "register") {
            if (!name.trim()) {
                newErrors.name = "Nome é obrigatório";
            } else if (name.trim().length < 2) {
                newErrors.name = "Nome deve ter pelo menos 2 caracteres";
            }

            if (!confirmPassword) {
                newErrors.confirmPassword = "Confirme sua senha";
            } else if (password !== confirmPassword) {
                newErrors.confirmPassword = "As senhas não coincidem";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage("");
        
        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            if (mode === "login") {
                const result = await loginWithEmail(email, password);
                if (!result.success) {
                    handleAuthError(result.error, result.message);
                }
            } else {
                const result = await register(name, email, password, confirmPassword);
                if (result.success) {
                    setSuccessMessage(result.message || "Conta criada com sucesso!");
                } else {
                    handleAuthError(result.error, result.message);
                }
            }
        } catch (error) {
            setErrors({ general: "Ocorreu um erro inesperado. Tente novamente." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAuthError = (errorCode?: string, message?: string) => {
        switch (errorCode) {
            case "USER_NOT_FOUND":
                setErrors({ 
                    general: message || "Email não encontrado",
                    email: "Conta não encontrada"
                });
                break;
            case "INVALID_CREDENTIALS":
                setErrors({ 
                    general: message || "Email ou senha incorretos"
                });
                break;
            case "USE_GOOGLE":
                setErrors({ 
                    general: message || "Esta conta usa login com Google"
                });
                break;
            case "PASSWORD_NOT_SET":
                setErrors({ 
                    general: message || "Defina uma senha para sua conta"
                });
                setMode("register");
                break;
            case "EMAIL_EXISTS":
                setErrors({ 
                    email: message || "Este email já está em uso"
                });
                break;
            case "DOMAIN_NOT_ALLOWED":
                setErrors({ 
                    email: message || "Domínio de email não permitido"
                });
                break;
            case "WEAK_PASSWORD":
                setErrors({ 
                    password: message || "Senha muito fraca"
                });
                break;
            case "PASSWORDS_DONT_MATCH":
                setErrors({ 
                    confirmPassword: message || "As senhas não coincidem"
                });
                break;
            default:
                setErrors({ 
                    general: message || "Erro na autenticação. Tente novamente."
                });
        }
    };

    const switchMode = () => {
        setMode(mode === "login" ? "register" : "login");
        setErrors({});
        setSuccessMessage("");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black transition-colors duration-300">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
                    <p className="mt-4 text-zinc-500 dark:text-zinc-400">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4 py-8 transition-colors duration-300 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[128px] opacity-10 dark:opacity-20"></div>
                <div className="absolute top-[60%] -left-[10%] w-[40%] h-[40%] bg-zinc-400 dark:bg-zinc-800 rounded-full blur-[128px] opacity-10 dark:opacity-20"></div>
            </div>

            {/* Theme Toggle - Top Right */}
            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-500 transition-colors"
            >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="max-w-md w-full space-y-6">
                {/* Logo e Título */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                        <TrendingUp className="w-9 h-9 text-black" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                        Axis
                    </h1>
                    <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                        Sistema de Gestão de KPIs
                    </p>
                </div>

                {/* Card Principal */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-8 backdrop-blur-lg">
                    {/* Tabs */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 mb-6">
                        <button
                            onClick={() => { setMode("login"); setErrors({}); setSuccessMessage(""); }}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                mode === "login"
                                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                            }`}
                        >
                            Entrar
                        </button>
                        <button
                            onClick={() => { setMode("register"); setErrors({}); setSuccessMessage(""); }}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                mode === "register"
                                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                            }`}
                        >
                            Criar Conta
                        </button>
                    </div>

                    {/* Mensagens de Erro/Sucesso */}
                    {(callbackError || errors.general) && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 rounded-xl text-sm flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{errors.general || "Falha na autenticação. Tente novamente."}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-xl text-sm flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Campo Nome (apenas no registro) */}
                        {mode === "register" && (
                            <div>
                                <label htmlFor="name" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                                    Nome completo
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                                            errors.name ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                                        }`}
                                        placeholder="Seu nome"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Campo Email */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                                Email corporativo
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                                        errors.email ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                                    }`}
                                    placeholder="seu.email@grupovorp.com"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Campo Senha */}
                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full pl-11 pr-12 py-3 border rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                                        errors.password ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                                    }`}
                                    placeholder="••••••••"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {errors.password}
                                </p>
                            )}
                            {mode === "register" && !errors.password && (
                                <p className="mt-1.5 text-xs text-zinc-400">
                                    Mínimo 8 caracteres, com maiúscula, minúscula e número
                                </p>
                            )}
                        </div>

                        {/* Campo Confirmar Senha (apenas no registro) */}
                        {mode === "register" && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                                    Confirmar senha
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                                            errors.confirmPassword ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                                        }`}
                                        placeholder="••••••••"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Botão Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                                    <span>Aguarde...</span>
                                </>
                            ) : (
                                <span>{mode === "login" ? "Entrar" : "Criar Conta"}</span>
                            )}
                        </button>
                    </form>

                    {/* Divisor */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200 dark:border-zinc-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="px-3 bg-white dark:bg-zinc-900 text-zinc-400 font-semibold tracking-wider">
                                ou continue com
                            </span>
                        </div>
                    </div>

                    {/* Botão Google */}
                    <button
                        onClick={loginWithGoogle}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span className="font-semibold">Google</span>
                    </button>

                    {/* Link para alternar modo */}
                    <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        {mode === "login" ? (
                            <>
                                Não tem uma conta?{" "}
                                <button
                                    onClick={() => switchMode()}
                                    className="text-amber-500 hover:text-amber-400 font-semibold transition-colors"
                                >
                                    Criar conta
                                </button>
                            </>
                        ) : (
                            <>
                                Já tem uma conta?{" "}
                                <button
                                    onClick={() => switchMode()}
                                    className="text-amber-500 hover:text-amber-400 font-semibold transition-colors"
                                >
                                    Entrar
                                </button>
                            </>
                        )}
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-zinc-400">
                    © {new Date().getFullYear()} Axis. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
