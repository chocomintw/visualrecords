"use client"


import { useState, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Download, Upload, Trash2, Edit, FileDigit, Save, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { Contact } from "@/types"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { useAppStore } from "@/lib/store"

export default function ContactEditor() {
    const { parsedData, setContacts } = useAppStore()
    const contacts = parsedData.contacts

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isTextImportDialogOpen, setIsTextImportDialogOpen] = useState(false)
    const [currentContact, setCurrentContact] = useState<Contact | null>(null)
    const [editIndex, setEditIndex] = useState<number>(-1)
    const [textInput, setTextInput] = useState("")
    const [duplicateMode, setDuplicateMode] = useState<"replace" | "keep-both" | "skip">("keep-both")
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Form states
    const [name, setName] = useState("")
    const [number, setNumber] = useState("")
    const [fullName, setFullName] = useState("")

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50

    // Calculate pagination
    const totalPages = Math.ceil(contacts.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedContacts = useMemo(() => {
        return contacts.slice(startIndex, startIndex + itemsPerPage)
    }, [contacts, startIndex])

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage)
        }
    }

    const handleAddContact = () => {
        if (!name || !number) {
            toast.error("Name and Number are required")
            return
        }

        const newContact: Contact = {
            "Contact Name": name,
            "Phone Number": number,
            "Full Name": fullName,
        }

        setContacts([...contacts, newContact])
        setName("")
        setNumber("")
        setFullName("")
        setIsAddDialogOpen(false)
        toast.success("Contact added")
    }

    const handleEditClick = (contact: Contact, index: number) => {
        setCurrentContact(contact)
        setEditIndex(index)
        setName(contact["Contact Name"])
        setNumber(contact["Phone Number"])
        setFullName(contact["Full Name"] || "")
        setIsEditDialogOpen(true)
    }

    const handleUpdateContact = () => {
        if (!name || !number) {
            toast.error("Name and Number are required")
            return
        }

        const updatedContacts = [...contacts]
        updatedContacts[editIndex] = {
            "Contact Name": name,
            "Phone Number": number,
            "Full Name": fullName,
        }

        setContacts(updatedContacts)
        setIsEditDialogOpen(false)
        toast.success("Contact updated")
    }

    const handleDeleteContact = (index: number) => {
        const updatedContacts = contacts.filter((_, i) => i !== index)
        setContacts(updatedContacts)
        toast.success("Contact deleted")
    }

    const handleExportCSV = () => {
        if (contacts.length === 0) {
            toast.error("No contacts to export")
            return
        }

        const ws = XLSX.utils.json_to_sheet(contacts)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Contacts")
        XLSX.writeFile(wb, "contacts.csv")
        toast.success("Contacts exported to CSV")
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: "binary" })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws) as any[]

                // Map to Contact interface
                const importedContacts: Contact[] = data.map((row) => ({
                    "Contact Name": row["Contact Name"] || row["name"] || "",
                    "Phone Number": row["Phone Number"] || row["number"] || row["phone"] || "",
                    "Full Name": row["Full Name"] || row["fullName"] || row["Additional Info"] || row["info"] || "",
                })).filter(c => c["Contact Name"] || c["Phone Number"])

                setContacts([...contacts, ...importedContacts])
                toast.success(`Imported ${importedContacts.length} contacts`)
            } catch (error) {
                console.error(error)
                toast.error("Failed to parse file")
            }
        }
        reader.readAsBinaryString(file)
        e.target.value = ""
    }

    const handleFileDownNumbers = () => {
        const updatedContacts = contacts.map(contact => {
            const rawNumber = contact["Phone Number"]
            // Extract digits only
            const cleanNumber = rawNumber.replace(/\D/g, "")

            let newFullName = contact["Full Name"] || ""
            if (cleanNumber && cleanNumber !== rawNumber) {
                newFullName = newFullName ? `${newFullName} | Real: ${cleanNumber}` : `Real: ${cleanNumber}`
            }

            return {
                ...contact,
                "Full Name": newFullName
            }
        })

        setContacts(updatedContacts)
        toast.success("Numbers processed")
    }

    const parseTextContacts = (text: string): Contact[] => {
        const lines = text.split('\n').filter(line => line.trim())
        const contacts: Contact[] = []

        // Regex pattern to match: [time] Name (PhoneNumber) - Status
        // Example: [23:28:25] Jesus (75262832) - Offline
        const pattern = /\[.*?\]\s*(.+?)\s*\((\d+)\)/g

        for (const line of lines) {
            const matches = [...line.matchAll(pattern)]
            for (const match of matches) {
                const name = match[1].trim()
                const phoneNumber = match[2].trim()

                if (name && phoneNumber) {
                    contacts.push({
                        "Contact Name": name,
                        "Phone Number": phoneNumber,
                        "Full Name": undefined
                    })
                }
            }
        }

        return contacts
    }

    const handleTextImport = () => {
        if (!textInput.trim()) {
            toast.error("Please paste some text to import")
            return
        }

        const parsedContacts = parseTextContacts(textInput)

        if (parsedContacts.length === 0) {
            toast.error("No valid contacts found in the text")
            return
        }

        // Detect duplicates
        const existingNumbers = new Set(contacts.map(c => c["Phone Number"]))
        const duplicates: Contact[] = []
        const unique: Contact[] = []

        parsedContacts.forEach(contact => {
            if (existingNumbers.has(contact["Phone Number"])) {
                duplicates.push(contact)
            } else {
                unique.push(contact)
            }
        })

        let finalContacts = [...contacts]
        let addedCount = 0

        // Handle duplicates based on mode
        if (duplicates.length > 0) {
            if (duplicateMode === "replace") {
                // Remove old contacts with duplicate numbers
                const duplicateNumbers = new Set(duplicates.map(d => d["Phone Number"]))
                finalContacts = finalContacts.filter(c => !duplicateNumbers.has(c["Phone Number"]))
                finalContacts.push(...duplicates)
                addedCount = duplicates.length
            } else if (duplicateMode === "keep-both") {
                // Add suffix to contact names
                duplicates.forEach(newContact => {
                    const phoneNumber = newContact["Phone Number"]
                    const existingWithSameNumber = finalContacts.filter(
                        c => c["Phone Number"] === phoneNumber
                    )
                    const suffix = existingWithSameNumber.length + 1
                    finalContacts.push({
                        ...newContact,
                        "Contact Name": `${newContact["Contact Name"]} ${suffix}`
                    })
                })
                addedCount = duplicates.length
            }
            // If mode is "skip", duplicates are simply not added
        }

        // Add unique contacts
        finalContacts.push(...unique)
        addedCount += unique.length

        setContacts(finalContacts)
        setTextInput("")
        setIsTextImportDialogOpen(false)

        if (duplicates.length > 0) {
            const action = duplicateMode === "replace" ? "replaced" : duplicateMode === "keep-both" ? "added with suffix" : "skipped"
            toast.success(`Imported ${addedCount} contact${addedCount !== 1 ? 's' : ''}. ${duplicates.length} duplicate${duplicates.length !== 1 ? 's' : ''} ${action}.`)
        } else {
            toast.success(`Imported ${addedCount} contact${addedCount !== 1 ? 's' : ''}`)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Contact List Editor</CardTitle>
                            <CardDescription>Create, edit, and manage your contact lists</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                            />
                            <Button variant="outline" onClick={handleImportClick}>
                                <Upload className="mr-2 h-4 w-4" />
                                Import File
                            </Button>
                            <Dialog open={isTextImportDialogOpen} onOpenChange={setIsTextImportDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Import Text
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Import Contacts from Text</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="text-input">Paste your contacts</Label>
                                            <textarea
                                                id="text-input"
                                                value={textInput}
                                                onChange={(e) => setTextInput(e.target.value)}
                                                placeholder="[00:00:25] Contact (12345678) - Offline"
                                                className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Format: <code className="bg-muted px-1 py-0.5 rounded">[time] Name (PhoneNumber) - Status</code>
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="duplicate-mode">If duplicate phone numbers are found:</Label>
                                            <select
                                                id="duplicate-mode"
                                                value={duplicateMode}
                                                onChange={(e) => setDuplicateMode(e.target.value as "replace" | "keep-both" | "skip")}
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                                <option value="keep-both">Keep both (add number suffix to name)</option>
                                                <option value="replace">Replace existing contact</option>
                                                <option value="skip">Skip duplicate</option>
                                            </select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleTextImport}>Import Contacts</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button variant="outline" onClick={handleExportCSV}>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                            <Button variant="secondary" onClick={handleFileDownNumbers}>
                                <FileDigit className="mr-2 h-4 w-4" />
                                Extract Numbers
                            </Button>
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Contact
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Contact</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="number">Phone Number</Label>
                                            <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="555-0123" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Michael Doe" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddContact}>Save Contact</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone Number</TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No contacts found. Add one or import a list.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedContacts.map((contact, index) => (
                                        <TableRow key={startIndex + index}>
                                            <TableCell className="font-medium">{contact["Contact Name"]}</TableCell>
                                            <TableCell>{contact["Phone Number"]}</TableCell>
                                            <TableCell>{contact["Full Name"]}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(contact, startIndex + index)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteContact(startIndex + index)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {contacts.length > 0 && (
                        <div className="flex items-center justify-between px-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, contacts.length)} of {contacts.length} contacts
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <div className="text-sm">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Contact</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-number">Phone Number</Label>
                            <Input id="edit-number" value={number} onChange={(e) => setNumber(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-fullName">Full Name</Label>
                            <Input id="edit-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateContact}>Update Contact</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
