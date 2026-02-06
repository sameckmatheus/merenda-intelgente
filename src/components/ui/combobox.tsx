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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

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
    hideSearch?: boolean
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
    hideSearch = false
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")

    // Normalize for case/accent-insensitive search
    const normalizeForSearch = (str: string): string => {
        return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9\s]/g, ""); // Keep alphanumeric and spaces
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal text-left rounded-2xl",
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
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 rounded-2xl" align="start">
                <Command shouldFilter={false} className="rounded-2xl">
                    {!hideSearch && (
                        <div className="flex items-center border-b border-slate-100 px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <CommandInput
                                placeholder={searchPlaceholder}
                                className="h-11"
                                value={searchTerm}
                                onValueChange={setSearchTerm}
                            />
                        </div>
                    )}
                    <CommandList>
                        <CommandEmpty className="py-6 text-center text-sm">{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.filter(option =>
                                normalizeForSearch(option.label).includes(normalizeForSearch(searchTerm))
                            ).map((option) => (
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
            </PopoverContent>
        </Popover>
    )
}
