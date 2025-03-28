import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface Income {
    id: string;
    income_amt: number;
    created_date: string;
}

const formSchema = z.object({
    income_amt: z.number().positive("Amount must be positive"),
});

type FormValues = z.infer<typeof formSchema>;

const ITEMS_PER_PAGE = 10;

const IncomePage = () => {
    const { user } = useAuth();
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editIncome, setEditIncome] = useState<Income | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            income_amt: 0,
        },
    });

    // Fetch incomes when component mounts or user changes
    useEffect(() => {
        const fetchIncomes = async () => {
            if (!user?.id) {
                setIncomes([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(
                    `https://touching-man-22.hasura.app/api/rest/getincomes?user_id=${user.id}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "x-hasura-admin-secret":
                                "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb",
                        },
                    }
                );

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch incomes");
                }

                setIncomes(data.income || []);
            } catch (error) {
                console.error("Error fetching incomes:", error);
                toast({
                    title: "Error",
                    description: "Failed to load incomes",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchIncomes();
    }, [user?.id, toast]);

    const handleSaveIncome = async (values: FormValues) => {
        if (!user?.id) {
            toast({
                title: "Error",
                description: "Please login to add income",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("https://touching-man-22.hasura.app/api/rest/addincome", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-hasura-admin-secret":
                        "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb",
                },
                body: JSON.stringify({
                    income_amt: values.income_amt,
                    user_id: user.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to add income");
            }

            const newIncomeItem = {
                id: data.id || Date.now().toString(),
                income_amt: values.income_amt,
                created_date: new Date().toISOString().split("T")[0],
            };

            setIncomes(prev => [...prev, newIncomeItem]);
            form.reset();
            setIsAddDialogOpen(false);

            toast({
                title: "Success",
                description: "Income added successfully",
            });
        } catch (error) {
            console.error("Error adding income:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add income",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditIncome = async (values: FormValues) => {
        if (!user?.id || !editIncome?.id) {
            toast({
                title: "Error",
                description: "Invalid user or income",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                "https://touching-man-22.hasura.app/api/rest/updateincome",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret":
                            "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb",
                    },
                    body: JSON.stringify({
                        id: editIncome.id,
                        user_id: user.id,
                        income_amt: values.income_amt,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update income");
            }

            if (data.update_income?.affected_rows !== 1) {
                throw new Error("No rows affected or unexpected response");
            }

            // Update local state with the returned income data
            setIncomes(prev =>
                prev.map(inc =>
                    inc.id === editIncome.id
                        ? { ...inc, income_amt: values.income_amt }
                        : inc
                )
            );
            setEditIncome(null);
            setIsEditDialogOpen(false);

            toast({
                title: "Success",
                description: "Income updated successfully",
            });
        } catch (error) {
            console.error("Error updating income:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update income",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteIncome = async (id: string) => {
        if (!user?.id) {
            toast({
                title: "Error",
                description: "Please login to delete incomes",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                `https://touching-man-22.hasura.app/api/rest/deleteincome?id=${id}&user_id=${user.id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret":
                            "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb",
                    },
                }
            );

            const data = await response.json();
            console.log("Delete response:", data); // Log the response for debugging

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete income");
            }

            if (data.delete_incomes?.affected_rows === 1 || response.status === 200) {
                setIncomes(prev => prev.filter(inc => inc.id !== id));
                toast({
                    title: "Success",
                    description: "Income deleted successfully",
                });
            } else {
                throw new Error("No rows affected or unexpected response");
            }
        } catch (error) {
            console.error("Error deleting income:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete income",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(incomes.length / ITEMS_PER_PAGE);
    const paginatedIncomes = incomes.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Income Master</h1>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isLoading}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {isLoading ? "Loading..." : "Add Income"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Income</DialogTitle>
                            <DialogDescription>Record a new income entry.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSaveIncome)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="income_amt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? "Saving..." : "Save"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                {isLoading && incomes.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                        Loading incomes...
                    </div>
                ) : incomes.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                        {user ? "No incomes found" : "Please login to view incomes"}
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr No.</TableHead>
                                    <TableHead>Income (₹)</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedIncomes.map((income, index) => (
                                    <TableRow key={income.id}>
                                        <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                                        <TableCell>₹{income.income_amt.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mr-2"
                                                onClick={() => {
                                                    setEditIncome(income);
                                                    form.setValue("income_amt", income.income_amt);
                                                    setIsEditDialogOpen(true);
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteIncome(income.id)}
                                                disabled={isLoading}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {totalPages > 1 && (
                            <Pagination className="mt-4">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePageChange(currentPage - 1);
                                            }}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handlePageChange(page);
                                                }}
                                                isActive={currentPage === page}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePageChange(currentPage + 1);
                                            }}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </>
                )}
            </div>

            {/* Edit Income Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Income</DialogTitle>
                        <DialogDescription>Update the income amount.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleEditIncome)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="income_amt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Updating..." : "Update"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default IncomePage;