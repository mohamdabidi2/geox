import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Use the correct AuthContext hook
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff, Factory, X } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    // Use the correct AuthContext hook
    const { login } = useAuth();
    const navigate = useNavigate();

    // Effet pour afficher l'alerte d'erreur avec animation
    useEffect(() => {
        if (error) {
            setShowErrorAlert(true);
        }
    }, [error]);

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        
        setLoading(true);
        setError('');
        setMessage('');

        if (!email || !password) {
            setError('Veuillez remplir tous les champs');
            setLoading(false);
            return false;
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Veuillez entrer une adresse e-mail valide');
            setLoading(false);
            return false;
        }

        try {
            const result = await login(email, password);
            // console.log(result)
            // alert(result)
            // Gérer tous les scénarios de réponse possibles
            if (result && result.success) {
                navigate('/dashboard');
            } else if (result && result.needsEmailVerification) {
                const msg = result.message || 'Veuillez vérifier votre e-mail pour confirmer votre compte.';
                setMessage(msg);
                setTimeout(() => navigate('/email-verification'), 1500);
            } else if (result && result.error) {
                setError(result.error);
            } else {
                setError('Échec de la connexion. Veuillez réessayer.');
            }
        } catch (err) {
            setError('Une erreur inattendue est survenue');
            console.error('Erreur de connexion :', err);
        } finally {
            setLoading(false);
        }
        
        return false;
    };

    // Fonction pour fermer l'alerte - recharge la page
    const handleAlertClose = () => {
        setShowErrorAlert(false);
        setTimeout(() => {
            setError('');
        }, 300);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="flex justify-center items-center mb-6">
                        <div className="bg-blue-600 p-3 rounded-lg">
                            <Factory className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="ml-3 text-3xl font-bold text-gray-900">Textule ERP</h1>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800">
                        Connexion à Textule ERP
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Accédez à votre tableau de bord en saisissant vos identifiants.
                    </p>
                </div>

                <Card className="shadow-md border-gray-200">
                    <CardContent className="pt-6">
                        <form 
                            onSubmit={handleSubmit} 
                            className="space-y-6" 
                            noValidate
                            id="login-form"
                        >
                            {/* Alerte d'erreur avec effets */}
                            {error && showErrorAlert && (
                                <Alert
                                    variant="destructive"
                                    className="mb-4 relative animate-shake transition-all duration-300"
                                    style={{
                                        boxShadow: '0 0 0 4px rgba(239,68,68,0.15)',
                                        borderColor: '#ef4444',
                                        animation: 'shake 0.3s',
                                    }}
                                >
                                    <AlertDescription className="flex items-center">
                                        <span className="mr-2">
                                            <X className="h-5 w-5 text-red-500 animate-pulse" />
                                        </span>
                                        <span className="font-semibold">{error}</span>
                                    </AlertDescription>
                                    <button
                                        type="button"
                                        className="absolute right-2 top-2 text-red-800 hover:text-red-900 transition-colors"
                                        onClick={handleAlertClose}
                                        aria-label="Fermer l'alerte d'erreur"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </Alert>
                            )}
                            <style>
                                {`
                                @keyframes shake {
                                    0% { transform: translateX(0); }
                                    20% { transform: translateX(-8px); }
                                    40% { transform: translateX(8px); }
                                    60% { transform: translateX(-8px); }
                                    80% { transform: translateX(8px); }
                                    100% { transform: translateX(0); }
                                }
                                `}
                            </style>
                            
                            {message && (
                                <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200 relative">
                                    <AlertDescription>{message}</AlertDescription>
                                    <button
                                        type="button"
                                        className="absolute right-2 top-2 text-blue-800 hover:text-blue-900"
                                        onClick={handleAlertClose}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </Alert>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            className="pl-10 h-11 border-gray-300 focus:border-blue-500"
                                            placeholder="Entrez votre e-mail"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            required
                                            className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500"
                                            placeholder="Entrez votre mot de passe"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Utilisez 8 caractères ou plus avec un mélange de lettres et de chiffres.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="remember" 
                                        checked={rememberMe}
                                        onCheckedChange={(checked) => setRememberMe(checked)}
                                    />
                                    <Label htmlFor="remember" className="text-sm text-gray-600">Se souvenir de moi</Label>
                                </div>
                                <button
                                    type="button"
                                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                                    onClick={() => navigate('/forgot-password')}
                                >
                                    Mot de passe oublié ?
                                </button>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                    disabled={loading}
                                    id="login-button"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Connexion en cours...
                                        </>
                                    ) : (
                                        'Se connecter'
                                    )}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-xs text-center text-gray-500">
                                En continuant, vous acceptez nos{' '}
                                <a href="#" className="text-blue-600 hover:text-blue-500">Conditions</a>
                                {' '}et notre{' '}
                                <a href="#" className="text-blue-600 hover:text-blue-500">Politique de confidentialité</a>.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}