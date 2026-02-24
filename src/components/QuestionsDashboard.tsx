'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FileQuestion, Percent, Loader2 } from "lucide-react";
import { createClient } from '@/app/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type DashboardData = {
  totalQuestions: number;
  questionsBySubject: {
    subject: string;
    count: number;
  }[];
  answeredRatio: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A239CA', '#FF4560', '#00E396'];

export function QuestionsDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const { data: functionData, error } = await supabase.functions.invoke('get-question-analytics');
                
                if (error) {
                    throw error;
                }

                setData(functionData);
            } catch (error: any) {
                console.error("Error fetching dashboard data:", error);
                toast({
                    title: "Erro ao Carregar Dashboard",
                    description: "Não foi possível buscar os dados de análise. Tente recarregar a página.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [supabase, toast]);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (!data) {
        return <div className='text-center text-muted-foreground'>Não foi possível carregar os dados do dashboard.</div>;
    }

  return (
    <div className="space-y-6 mb-10">
        <h2 className="text-2xl font-black text-primary italic">Visão Geral do Banco</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-70">Total de Questões</CardTitle>
                    <FileQuestion className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-5xl font-bold text-primary">{data.totalQuestions}</div>
                    <p className="text-xs text-muted-foreground mt-1">Questões disponíveis para os alunos</p>
                </CardContent>
            </Card>
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-70">Taxa de Respostas</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-5xl font-bold text-primary">{data.answeredRatio}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Das questões já foram respondidas alguma vez</p>
                </CardContent>
            </Card>
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">Distribuição por Matéria</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.questionsBySubject} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="subject" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                                backdropFilter: 'blur(5px)',
                                border: '1px solid #E0E0E0',
                                borderRadius: '1rem',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            }}
                        />
                        <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} background={{ fill: '#eee', radius: 4 }}>
                            {data.questionsBySubject.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    </div>
  );
}

// Skeleton component for loading state
function DashboardSkeleton() {
    return (
        <div className="space-y-6 mb-10 animate-pulse">
            <Skeleton className="h-8 w-1/3" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-36 rounded-[2.5rem]" />
                <Skeleton className="h-36 rounded-[2.5rem]" />
                <Skeleton className="h-36 rounded-[2.5rem] lg:col-span-1" />
            </div>
            <Skeleton className="h-80 rounded-[2.5rem]" />
        </div>
    );
}
