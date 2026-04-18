'use client';

import { useEffect, useState } from 'react';
import { useSessionMonitor } from '@/lib/hooks/use-session-monitor';
import { useAuthStore } from '@/lib/stores/auth';
import { useAuth } from '@/lib/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SessionManager() {
    const { status, message, reason } = useSessionMonitor();
    useAuthStore();
    const { signOut } = useAuth();
    const [openTerminated, setOpenTerminated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (status === 'terminated') {
            setOpenTerminated(true);
        } else {
             setOpenTerminated(false);
        }
    }, [status]);

    const handleLogout = async () => {
        await signOut();
        setOpenTerminated(false);
        router.push('/login');
    };

    // If active, render nothing
    if (status === 'active') return null;

    return (
        <>
            {/* Warning Banner */}
            {status === 'warning' && (
                <div className="fixed bottom-4 right-4 z-100 max-w-sm animate-in slide-in-from-bottom-5">
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Session Warning</AlertTitle>
                        <AlertDescription>{message}</AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Termination Modal */}
             <Dialog open={openTerminated} onOpenChange={(open) => { if(!open) handleLogout(); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                             <AlertTriangle className="h-5 w-5" />
                             Session Expired
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            {reason === 'grace_period_expired_2_devices' ? 
                                "You have been logged out because your account was active on multiple devices beyond the allowed time (90m for 2 devices)." :
                             reason === 'grace_period_expired_3_devices' ?
                                "You have been logged out because your account was active on multiple devices beyond the allowed time (25m for 3 devices)." :
                                reason === 'session_not_found' ?
                                "Your session is no longer valid. Please log in again." :
                                "You have been logged out from another device."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={handleLogout} variant="destructive" className="w-full sm:w-auto">
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
