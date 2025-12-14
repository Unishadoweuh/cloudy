'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createInstance, getNodes, getTemplates } from '@/lib/api';
import { cn } from '@/lib/utils';

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Server,
    Box,
    ArrowLeft,
    ArrowRight,
    Check,
    Loader2,
    Cpu,
    MemoryStick,
    Key,
    User,
    MapPin,
    Layout,
} from 'lucide-react';

// Schema
const formSchema = z.object({
    type: z.enum(["qemu", "lxc"]),
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    node: z.string().min(1, { message: "Please select a node." }),
    templateId: z.string().min(1, { message: "Please select a template." }),
    cores: z.preprocess((val) => Number(val), z.number().min(1).max(32)),
    memory: z.preprocess((val) => Number(val), z.number().min(128)),
    ciuser: z.string().optional(),
    cipassword: z.string().optional(),
    sshkeys: z.string().optional(),
    password: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
    { id: 'type', title: 'Type', icon: Layout },
    { id: 'location', title: 'Location', icon: MapPin },
    { id: 'resources', title: 'Resources', icon: Cpu },
    { id: 'auth', title: 'Auth', icon: Key },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                    <div key={step.id} className="flex items-center">
                        <div
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                                isActive && "bg-cyan-500/20 text-cyan-400",
                                isCompleted && "bg-emerald-500/20 text-emerald-400",
                                !isActive && !isCompleted && "bg-slate-700/50 text-slate-400"
                            )}
                        >
                            {isCompleted ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Icon className="h-4 w-4" />
                            )}
                            <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    "w-8 h-0.5 mx-2",
                                    isCompleted ? "bg-emerald-500" : "bg-slate-700"
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function TypeCard({
    type,
    selected,
    onClick,
}: {
    type: 'qemu' | 'lxc';
    selected: boolean;
    onClick: () => void;
}) {
    const isVM = type === 'qemu';

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative cursor-pointer rounded-xl p-6 transition-all",
                "border-2",
                selected
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
            )}
        >
            {selected && (
                <div className="absolute top-4 right-4">
                    <div className="p-1 rounded-full bg-cyan-500">
                        <Check className="h-4 w-4 text-white" />
                    </div>
                </div>
            )}

            <div
                className={cn(
                    "p-4 rounded-lg mb-4 w-fit",
                    selected
                        ? isVM ? "bg-cyan-500/20" : "bg-violet-500/20"
                        : "bg-slate-700/50"
                )}
            >
                {isVM ? (
                    <Server className={cn(
                        "h-8 w-8",
                        selected ? "text-cyan-400" : "text-slate-400"
                    )} />
                ) : (
                    <Box className={cn(
                        "h-8 w-8",
                        selected ? "text-violet-400" : "text-slate-400"
                    )} />
                )}
            </div>

            <h3 className="text-lg font-semibold text-white mb-1">
                {isVM ? 'Virtual Machine' : 'LXC Container'}
            </h3>
            <p className="text-sm text-slate-400">
                {isVM
                    ? 'Full virtualization with QEMU/KVM'
                    : 'Lightweight container virtualization'}
            </p>
        </div>
    );
}

export default function CreateInstancePage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedType, setSelectedType] = useState<'qemu' | 'lxc'>('qemu');
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    // Data Fetching
    const { data: nodes, isLoading: nodesLoading } = useQuery({
        queryKey: ['nodes'],
        queryFn: getNodes
    });

    const { data: allTemplates, isLoading: templatesLoading } = useQuery({
        queryKey: ['templates', selectedType],
        queryFn: () => getTemplates(selectedType)
    });

    const templates = allTemplates?.filter((t: any) => !selectedNode || t.node === selectedNode) || [];

    // Form
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            type: "qemu",
            name: "",
            node: "",
            templateId: "",
            cores: 2,
            memory: 2048,
            ciuser: "",
            cipassword: "",
            sshkeys: "",
            password: "",
        },
    });

    useEffect(() => {
        form.setValue('templateId', '');
    }, [selectedType, selectedNode, form]);

    useEffect(() => {
        form.setValue('type', selectedType);
    }, [selectedType, form]);

    // Mutation
    const createMutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const payload: any = {
                type: values.type,
                name: values.name,
                node: values.node,
                templateId: parseInt(values.templateId),
                cores: values.cores,
                memory: values.memory,
            };

            if (values.type === 'qemu') {
                if (values.ciuser) payload.ciuser = values.ciuser;
                if (values.cipassword) payload.cipassword = values.cipassword;
                if (values.sshkeys) payload.sshkeys = values.sshkeys;
            } else {
                if (values.password) payload.password = values.password;
                if (values.sshkeys) payload.sshkeys = values.sshkeys;
            }

            return createInstance(payload);
        },
        onSuccess: () => {
            router.push('/dashboard/instances');
        },
        onError: (error) => {
            console.error("Failed to create Instance", error);
        }
    });

    function onSubmit(values: FormValues) {
        createMutation.mutate(values);
    }

    function nextStep() {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    }

    const canProceedFromStep = (step: number) => {
        switch (step) {
            case 0: return true;
            case 1: return form.watch('node') && form.watch('templateId') && form.watch('name');
            case 2: return form.watch('cores') >= 1 && form.watch('memory') >= 128;
            case 3: return true;
            default: return false;
        }
    };

    if (nodesLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-slate-400 animate-spin mb-4" />
                <p className="text-slate-400">Loading resources...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push('/dashboard/instances')}
                    className="border-slate-600 hover:bg-slate-700 text-slate-300"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Create Instance</h1>
                    <p className="text-slate-400">
                        Deploy a new virtual machine or container
                    </p>
                </div>
            </div>

            <StepIndicator currentStep={currentStep} />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Step 0: Type Selection */}
                    {currentStep === 0 && (
                        <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-white">Virtualization Type</CardTitle>
                                <CardDescription>
                                    Choose between a full virtual machine or lightweight container
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TypeCard
                                        type="qemu"
                                        selected={selectedType === 'qemu'}
                                        onClick={() => setSelectedType('qemu')}
                                    />
                                    <TypeCard
                                        type="lxc"
                                        selected={selectedType === 'lxc'}
                                        onClick={() => setSelectedType('lxc')}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 1: Location & Template */}
                    {currentStep === 1 && (
                        <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-white">Location & Template</CardTitle>
                                <CardDescription>
                                    Select the node and source template
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="node"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-200">Node</FormLabel>
                                            <Select
                                                onValueChange={(val) => {
                                                    field.onChange(val);
                                                    setSelectedNode(val);
                                                }}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                                                        <SelectValue placeholder="Select a node" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-800 border-slate-700">
                                                    {nodes?.map((node: any) => (
                                                        <SelectItem key={node.node} value={node.node}>
                                                            {node.node} ({node.status})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="templateId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-200">Template</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={!selectedNode || templatesLoading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                                                        <SelectValue placeholder={!selectedNode ? "Select a node first" : "Select a template"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-800 border-slate-700">
                                                    {templates?.length === 0 && (
                                                        <div className="p-3 text-sm text-slate-400 text-center">
                                                            No templates found
                                                        </div>
                                                    )}
                                                    {templates?.map((t: any) => (
                                                        <SelectItem key={t.vmid} value={t.vmid.toString()}>
                                                            {t.name} (ID: {t.vmid})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-200">Instance Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="my-server"
                                                    className="bg-slate-900/50 border-slate-600 text-white"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Resources */}
                    {currentStep === 2 && (
                        <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-white">Resources</CardTitle>
                                <CardDescription>
                                    Configure CPU and memory allocation
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="cores"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-200 flex items-center gap-2">
                                                <Cpu className="h-4 w-4" />
                                                CPU Cores
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={32}
                                                    className="bg-slate-900/50 border-slate-600 text-white"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-slate-500">1-32 cores</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="memory"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-200 flex items-center gap-2">
                                                <MemoryStick className="h-4 w-4" />
                                                Memory (MB)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={128}
                                                    className="bg-slate-900/50 border-slate-600 text-white"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-slate-500">Minimum 128 MB</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Authentication */}
                    {currentStep === 3 && (
                        <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-white">Authentication</CardTitle>
                                <CardDescription>
                                    Configure user credentials and SSH access
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {selectedType === 'qemu' ? (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="ciuser"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-200 flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        Cloud-Init User
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="ubuntu"
                                                            className="bg-slate-900/50 border-slate-600 text-white"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="cipassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-200">Password</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            placeholder="••••••••"
                                                            className="bg-slate-900/50 border-slate-600 text-white"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-200">Root Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="bg-slate-900/50 border-slate-600 text-white"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="sshkeys"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-200 flex items-center gap-2">
                                                <Key className="h-4 w-4" />
                                                SSH Public Keys
                                            </FormLabel>
                                            <FormControl>
                                                <textarea
                                                    className="flex min-h-[100px] w-full rounded-lg bg-slate-900/50 border border-slate-600 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
                                                    placeholder="ssh-rsa AAAAB3N..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-slate-500">
                                                Paste your public SSH key
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="border-slate-600 hover:bg-slate-700 text-slate-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Previous
                        </Button>

                        {currentStep < steps.length - 1 ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                disabled={!canProceedFromStep(currentStep)}
                                className="bg-slate-700 hover:bg-slate-600 text-white"
                            >
                                Next
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Create Instance
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {createMutation.isError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                            Failed to create instance: {(createMutation.error as Error)?.message}
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}
