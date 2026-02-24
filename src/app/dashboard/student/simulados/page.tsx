'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Award, RotateCw, BrainCircuit, Library } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/AuthProvider';
import { createClient } from '@/app/lib/supabase';

const SIMULATION_SIZE = 10;

type Question = {
  id: string;
  question_text: string;
  options: { letter: string; text: string }[];
  correct_answer: string;
  subjects: { name: string } | null;
  year: number;
};

type SubjectWithCount = {
    id: string;
    name: string;
    question_count: number;
}

type Answer = {
  questionId: string;
  selected: string;
  correct: string;
};

export default function SimuladoPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [gameState, setGameState] = useState<'loading_subjects' | 'idle' | 'loading_questions' | 'active' | 'finished' | 'error'>('loading_subjects');
  const [subjects, setSubjects] = useState<SubjectWithCount[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      setGameState('loading_subjects');
      try {
        const { data, error } = await supabase.rpc('get_subjects_with_question_count');
        if (error) throw error;
        setSubjects(data || []);
        setGameState('idle');
      } catch (e) {
        console.error('Erro ao buscar matérias:', e);
        setGameState('error');
      }
    };
    fetchSubjects();
  }, [supabase]);

  const fetchQuestions = useCallback(async (subjectId: string) => {
    setGameState('loading_questions');
    try {
        const { data, error } = await supabase.rpc('get_random_questions_for_subject', {
            p_subject_id: subjectId,
            p_limit: SIMULATION_SIZE
        });

        if (error) throw error;

        // Mapeia o retorno da RPC para o formato esperado pelo frontend
        const formattedQuestions = data.map((q: any) => ({
            ...q,
            subjects: typeof q.subjects === 'string' ? JSON.parse(q.subjects) : q.subjects,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));

        setQuestions(formattedQuestions);
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setSelectedAnswer(null);
        setGameState('active');
    } catch (error) {
        console.error('Erro ao montar simulado:', error);
        setGameState('error');
    }
  }, [supabase]);

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const newAnswer = {
      questionId: questions[currentQuestionIndex].id,
      selected: selectedAnswer,
      correct: questions[currentQuestionIndex].correct_answer,
    };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setGameState('finished');
    }
  };

  const score = answers.filter(a => a.selected === a.correct).length;

  if (gameState === 'loading_subjects' || gameState === 'loading_questions') {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center flex-col gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <p className="text-sm font-black text-primary italic animate-pulse">
            {gameState === 'loading_subjects' ? 'Carregando matérias...' : 'Montando seu simulado...'}
        </p>
      </div>
    );
  }

  if (gameState === 'active') {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / questions.length) * 100;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
            <div className='bg-white p-4 md:p-6 rounded-2xl shadow-sm border-b-4 border-accent'>
                <div className='flex justify-between items-center mb-4 gap-2'>
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-accent" />
                      <p className='font-black text-primary text-xs md:text-sm uppercase tracking-widest'>QUESTÃO {currentQuestionIndex + 1} / {questions.length}</p>
                    </div>
                    <Badge variant="outline" className='font-black text-[10px] uppercase bg-primary text-white border-none h-7 px-4'>
                        {currentQuestion.subjects?.name || 'Geral'} • {currentQuestion.year}
                    </Badge>
                </div>
                <Progress value={progress} className="h-1.5 bg-muted rounded-full" />
            </div>

            <Card className="border-none shadow-xl rounded-[1.5rem] md:rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className='p-6 md:p-12 bg-muted/5'>
                <CardDescription className="text-sm md:text-xl font-medium text-slate-800 leading-relaxed italic">
                "{currentQuestion.question_text}"
                </CardDescription>
            </CardHeader>
            <CardContent className='p-6 md:p-12 pt-2'>
                <RadioGroup value={selectedAnswer ?? ''} onValueChange={setSelectedAnswer} className="space-y-3">
                {currentQuestion.options.map((opt) => (
                    <Label 
                    key={opt.letter} 
                    className={`flex items-start gap-4 text-xs md:text-base p-4 md:p-6 rounded-xl md:rounded-[1.5rem] border-2 transition-all cursor-pointer ${
                        selectedAnswer === opt.letter ? 'border-accent bg-accent/5' : 'border-muted/20 hover:border-accent/40'
                    }`}
                    >
                    <RadioGroupItem value={opt.letter} id={opt.letter} className="mt-1" />
                    <div className="flex gap-2 md:gap-4">
                        <span className={`font-black italic ${selectedAnswer === opt.letter ? 'text-accent' : 'text-primary/30'}`}>
                        {opt.letter.toUpperCase()}.
                        </span>
                        <span className="font-medium text-slate-700">{opt.text}</span>
                    </div>
                    </Label>
                ))}
                </RadioGroup>
            </CardContent>
            </Card>

            <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-3 rounded-2xl border border-white shadow-xl">
            <p className="hidden md:block text-[10px] font-black uppercase text-primary/40 px-4 italic">Analise com calma.</p>
            <Button 
                onClick={handleNextQuestion} 
                disabled={selectedAnswer === null} 
                className="w-full md:w-auto h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-sm md:text-lg px-8 bg-primary shadow-xl"
            >
                {currentQuestionIndex < questions.length - 1 ? 'Próxima Questão' : 'Finalizar Simulado'}
            </Button>
            </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <Card className="w-full max-w-xl text-center p-8 md:p-16 shadow-2xl rounded-[2rem] md:rounded-[3rem] bg-white border-none">
          <CardHeader>
            <div className="h-20 w-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Award className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-black text-primary italic">Simulado Concluído!</CardTitle>
            <CardDescription className="text-lg font-medium mt-2">Você acertou {score} de {questions.length} questões.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <Button onClick={() => setGameState('idle')} className="w-full h-14 rounded-xl bg-primary font-black">
                <RotateCw className="h-5 w-5 mr-2" /> Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (gameState === 'error') {
    return (
        <div className='flex flex-col items-center justify-center h-[60vh] gap-4'>
            <p className='text-red-500 font-bold italic'>Ocorreu um erro ao carregar os dados.</p>
            <Button onClick={() => window.location.reload()} variant="outline">Recarregar Página</Button>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 p-4">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Library className="h-6 w-6 text-accent"/>
            </div>
            <h1 className="text-3xl font-black text-primary italic">Simulados por Matéria</h1>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {subjects.map(subject => (
                <Card key={subject.id} className={`border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between ${subject.question_count === 0 ? 'opacity-50' : ''}`}>
                    <CardHeader>
                        <CardTitle className='text-2xl font-black text-primary'>{subject.name}</CardTitle>
                        <CardDescription className='font-medium'>{subject.question_count} questões disponíveis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={() => fetchQuestions(subject.id)}
                            disabled={Number(subject.question_count) === 0}
                            className='w-full h-12 rounded-xl bg-primary font-black'
                        >
                            {Number(subject.question_count) === 0 ? 'Sem questões' : 'Começar Simulado'}
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}