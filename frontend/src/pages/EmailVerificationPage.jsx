import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function EmailVerificationPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Mail className="mx-auto h-12 w-12 text-blue-500" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Vérifiez votre e-mail
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Nous vous avons envoyé un lien de vérification
                    </p>
                </div>

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Vérification de l'e-mail requise
                        </CardTitle>
                        <CardDescription>
                            Veuillez vérifier votre e-mail pour confirmer votre compte
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <Clock className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                                <div>
                                    <h3 className="text-sm font-medium text-blue-800">
                                        Que se passe-t-il ensuite ?
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <ol className="list-decimal list-inside space-y-1">
                                            <li>Vérifiez votre boîte de réception (et le dossier spam)</li>
                                            <li>Cliquez sur le lien de vérification dans l'e-mail</li>
                                            <li>Créez votre mot de passe</li>
                                            <li>Accédez à votre tableau de bord</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <Mail className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
                                <div>
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        Vous n'avez pas reçu l'e-mail ?
                                    </h3>
                                    <p className="mt-1 text-sm text-yellow-700">
                                        Vérifiez votre dossier spam ou essayez de vous reconnecter pour renvoyer l'e-mail de vérification.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <Button
                                onClick={() => navigate('/login')}
                                variant="outline"
                                className="w-full"
                            >
                                Retour à la connexion
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
