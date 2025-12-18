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

// OS Detection and Icon mapping
// Icons should be placed in /public/os-icons/ as PNG files
// Example: ubuntu.png, debian.png, windows.png, etc.
const OS_PATTERNS: { pattern: RegExp; os: string; icon: string; color: string }[] = [
    { pattern: /ubuntu/i, os: 'Ubuntu', icon: 'ubuntu', color: 'from-orange-500 to-orange-600' },
    { pattern: /debian/i, os: 'Debian', icon: 'debian', color: 'from-red-500 to-red-600' },
    { pattern: /centos/i, os: 'CentOS', icon: 'centos', color: 'from-purple-500 to-purple-600' },
    { pattern: /rocky/i, os: 'Rocky Linux', icon: 'rocky', color: 'from-green-500 to-green-600' },
    { pattern: /alma/i, os: 'AlmaLinux', icon: 'alma', color: 'from-blue-500 to-blue-600' },
    { pattern: /fedora/i, os: 'Fedora', icon: 'fedora', color: 'from-blue-400 to-blue-500' },
    { pattern: /arch/i, os: 'Arch Linux', icon: 'arch', color: 'from-cyan-500 to-cyan-600' },
    { pattern: /alpine/i, os: 'Alpine', icon: 'alpine', color: 'from-slate-400 to-slate-500' },
    { pattern: /windows/i, os: 'Windows', icon: 'windows', color: 'from-sky-500 to-sky-600' },
    { pattern: /opensuse|suse/i, os: 'openSUSE', icon: 'opensuse', color: 'from-green-500 to-green-600' },
    { pattern: /mint/i, os: 'Linux Mint', icon: 'mint', color: 'from-emerald-500 to-emerald-600' },
    { pattern: /kali/i, os: 'Kali Linux', icon: 'kali', color: 'from-blue-600 to-blue-700' },
    { pattern: /proxmox/i, os: 'Proxmox', icon: 'proxmox', color: 'from-orange-600 to-orange-700' },
    { pattern: /rhel|redhat/i, os: 'RHEL', icon: 'rhel', color: 'from-red-600 to-red-700' },
    { pattern: /gentoo/i, os: 'Gentoo', icon: 'gentoo', color: 'from-purple-400 to-purple-500' },
    { pattern: /nixos/i, os: 'NixOS', icon: 'nixos', color: 'from-blue-500 to-blue-600' },
    { pattern: /freebsd/i, os: 'FreeBSD', icon: 'freebsd', color: 'from-red-500 to-red-600' },
];

function getOSInfo(name: string): { os: string; icon: string; color: string; iconPath: string } {
    for (const osPattern of OS_PATTERNS) {
        if (osPattern.pattern.test(name)) {
            return {
                os: osPattern.os,
                icon: osPattern.icon,
                color: osPattern.color,
                iconPath: `/os-icons/${osPattern.icon}.png`,
            };
        }
    }
    // Default fallback
    return {
        os: 'Linux',
        icon: 'linux',
        color: 'from-slate-500 to-slate-600',
        iconPath: '/os-icons/linux.png',
    };
}

// Component to display OS icon with fallback
function OSIcon({ osInfo, size = 32 }: { osInfo: ReturnType<typeof getOSInfo>; size?: number }) {
    const [imgError, setImgError] = useState(false);

    if (imgError) {
        // Fallback to first letter of OS name
        return (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                {osInfo.os.charAt(0)}
            </div>
        );
    }

    return (
        <img
            src={osInfo.iconPath}
            alt={osInfo.os}
            width={size}
            height={size}
            className="object-contain"
            onError={() => setImgError(true)}
        />
    );
}

function TemplateCard({
    template,
    selected,
    onClick,
}: {
    template: { vmid: number; name: string; node?: string };
    selected: boolean;
    onClick: () => void;
}) {
    const osInfo = getOSInfo(template.name);

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative cursor-pointer rounded-xl p-4 transition-all border-2 group",
                "hover:scale-[1.02] hover:shadow-lg",
                selected
                    ? "border-cyan-500 bg-cyan-500/10 shadow-cyan-500/20"
                    : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
            )}
        >
            {selected && (
                <div className="absolute top-3 right-3">
                    <div className="p-1 rounded-full bg-cyan-500">
                        <Check className="h-3 w-3 text-white" />
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-slate-700/50">
                    <OSIcon osInfo={osInfo} size={40} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">{template.name}</h4>
                    <p className="text-xs text-slate-400">
                        {osInfo.os} • ID: {template.vmid}
                    </p>
                </div>
            </div>
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
        // Only allow submission on the last step
        if (currentStep !== steps.length - 1) {
            console.log('Submission blocked: not on last step');
            return;
        }
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
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                    onKeyDown={(e) => {
                        // Prevent Enter from submitting the form unless we're on the last step
                        if (e.key === 'Enter' && currentStep < steps.length - 1) {
                            e.preventDefault();
                            if (canProceedFromStep(currentStep)) {
                                nextStep();
                            }
                        }
                    }}
                >
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
                                            {!selectedNode ? (
                                                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 text-center text-slate-400">
                                                    Sélectionnez d'abord un nœud
                                                </div>
                                            ) : templatesLoading ? (
                                                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 text-center text-slate-400">
                                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                                    Chargement des templates...
                                                </div>
                                            ) : templates?.length === 0 ? (
                                                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 text-center text-slate-400">
                                                    Aucun template disponible sur ce nœud
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                                    {templates?.map((t: any) => (
                                                        <TemplateCard
                                                            key={t.vmid}
                                                            template={t}
                                                            selected={field.value === t.vmid.toString()}
                                                            onClick={() => field.onChange(t.vmid.toString())}
                                                        />
                                                    ))}
                                                </div>
                                            )}
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
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 flex items-start gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-red-400 mb-1">Impossible de créer l&apos;instance</p>
                                <p className="text-sm">{(createMutation.error as Error)?.message?.replace('API Error: ', '') || 'Une erreur inattendue s\'est produite.'}</p>
                            </div>
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}
