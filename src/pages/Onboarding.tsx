import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const Onboarding = () => {
    const [loading, setLoading] = useState(false);
    const { user, refreshProfile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;

        const formData = new FormData(e.currentTarget);
        const fullName = formData.get('fullName') as string;
        const companyName = formData.get('companyName') as string;
        const companyUrl = formData.get('companyUrl') as string;

        setLoading(true);

        try {
            const { error } = await supabase.from('profiles').insert({
                id: user.id,
                full_name: fullName,
                company_name: companyName,
                company_url: companyUrl,
            });

            if (error) throw error;

            await refreshProfile();
            toast({
                title: "Profile Created",
                description: "Welcome to Signal!",
            });

            navigate('/dashboard');
        } catch (error: any) {
            console.error('Error creating profile:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to create profile. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-8"
            >
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome aboard</h1>
                    <p className="text-muted-foreground text-sm">
                        Let's get your business set up to start tracking competitors.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            placeholder="Alex Parker"
                            required
                            disabled={loading}
                            className="bg-card"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                            id="companyName"
                            name="companyName"
                            placeholder="Acme Corp"
                            required
                            disabled={loading}
                            className="bg-card"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="companyUrl">Company Website (URL)</Label>
                        <Input
                            id="companyUrl"
                            name="companyUrl"
                            type="url"
                            placeholder="https://acme.com"
                            required
                            disabled={loading}
                            className="bg-card"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Saving..." : "Go to Dashboard"}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
};

export default Onboarding;
