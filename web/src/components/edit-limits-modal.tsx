"use client"

import { useState, FormEvent } from "react"
import { X } from "lucide-react"

// ... (omitted)


import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUserLimits } from "@/lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { User } from "@/lib/types"

interface EditLimitsModalProps {
    user: User
    isOpen: boolean
    onClose: () => void
}

export function EditLimitsModal({ user, isOpen, onClose }: EditLimitsModalProps) {
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        maxCpu: user?.maxCpu ?? 4,
        maxMemory: user?.maxMemory ?? 4096,
        maxDisk: user?.maxDisk ?? 50,
        maxInstances: user?.maxInstances ?? 2,
        allowedNodes: Array.isArray(user?.allowedNodes) ? user.allowedNodes.join(',') : '',
    })

    const mutation = useMutation({
        mutationFn: (data: typeof formData) => updateUserLimits(user.id, {
            ...data,
            allowedNodes: data.allowedNodes.split(',').map(s => s.trim()).filter(Boolean)
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            onClose()
        }
    })

    if (!isOpen) return null

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        mutation.mutate(formData)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Edit Limits: {user.username}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-white">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxCpu">Max CPU Cores</Label>
                            <Input
                                id="maxCpu"
                                type="number"
                                value={formData.maxCpu}
                                onChange={e => setFormData({ ...formData, maxCpu: parseInt(e.target.value) || 0 })}
                                className="bg-slate-800 border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxMemory">Max RAM (MB)</Label>
                            <Input
                                id="maxMemory"
                                type="number"
                                value={formData.maxMemory}
                                onChange={e => setFormData({ ...formData, maxMemory: parseInt(e.target.value) || 0 })}
                                className="bg-slate-800 border-slate-700"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxDisk">Max Storage (GB)</Label>
                            <Input
                                id="maxDisk"
                                type="number"
                                value={formData.maxDisk}
                                onChange={e => setFormData({ ...formData, maxDisk: parseInt(e.target.value) || 0 })}
                                className="bg-slate-800 border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxInstances">Max VMs</Label>
                            <Input
                                id="maxInstances"
                                type="number"
                                value={formData.maxInstances}
                                onChange={e => setFormData({ ...formData, maxInstances: parseInt(e.target.value) || 0 })}
                                className="bg-slate-800 border-slate-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="allowedNodes">Allowed Nodes (comma separated, empty = all)</Label>
                        <Input
                            id="allowedNodes"
                            value={formData.allowedNodes}
                            onChange={e => setFormData({ ...formData, allowedNodes: e.target.value })}
                            placeholder="pve-01, pve-02"
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
