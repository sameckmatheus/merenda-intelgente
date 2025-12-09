"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog"

export interface Option {
    value: string
    label: string
}

interface ComboboxProps {
    options: Option[]
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
    modalTitle?: string
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Selecione...",
    searchPlaceholder = "Procurar...",
    emptyMessage = "Não encontrado.",
    className,
    disabled,
    modalTitle = "Selecione uma opção"
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal text-left",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">
                        {value
                            ? options.find((option) => option.value === value)?.label
                            : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0 overflow-hidden max-w-md bg-white border-0 shadow-2xl rounded-2xl">
                <DialogTitle className="sr-only">{modalTitle}</DialogTitle>
                <Command className="border-0 w-full">
                    <div className="flex items-center border-b border-slate-100 px-3 bg-slate-50/50">
                        <Search className="mr-2 h-5 w-5 shrink-0 text-slate-400" />
                        <CommandInput
                            placeholder={searchPlaceholder}
                            className="border-0 focus:ring-0 text-base h-14 bg-transparent selection:bg-blue-100"
                        />
                    </div>
                    <CommandList className="max-h-[300px] p-2">
                        <CommandEmpty className="py-6 text-center text-slate-500 text-sm">{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onChange(option.value)
                                        setOpen(false)
                                    }}
                                    className="cursor-pointer rounded-xl py-3 px-4 mb-1 aria-selected:bg-blue-50 aria-selected:text-blue-700 hover:bg-blue-50 transition-colors"
                                >
                                    <Check
                                        className={cn(
                                            "mr-3 h-5 w-5 text-blue-600",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="text-base font-medium">{option.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    )
}
