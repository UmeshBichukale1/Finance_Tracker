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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

interface Expense {
    id: string;
    expense_amt: number;
    created_date: string;
    category: {
        id: string;
        name: string;
    };
}

interface Category {
    id: string;
    name: string;
    user_id: string;
}

const formSchema = z.object({
    expense_amt: z.number().positive("Amount must be positive"),
    category_id: z.string().min(1, "Please select a category"),
});

type FormValues = z.infer<typeof formSchema>;

const ITEMS_PER_PAGE = 10;

const ExpensePage = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editExpense, setEditExpense] = useState<Expense | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            expense_amt: 0,
            category_id: "",
        },
    });

    // Fetch categories for dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            if (!user?.id) {
                setCategories([]);
                return;
            }

            try {
                const response = await fetch(
                    `https://touching-man-22.hasura.app/api/rest/getcategoriesdropdownbyuser?user_id=${user.id}`,
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
                    throw new Error(data.message || "Failed to fetch categories");
                }

                setCategories(data.categories || []);
                if (data.categories && data.categories.length > 0) {
                    form.reset({
                        expense_amt: 0,
                        category_id: data.categories[0].id,
                    });
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                toast({
                    title: "Error",
                    description: "Failed to load categories for dropdown",
                    variant: "destructive",
                });
            }
        };

        fetchCategories();
    }, [user?.id, toast, form]);

    // Fetch expenses
    useEffect(() => {
        const fetchExpenses = async () => {
            if (!user?.id) {
                setExpenses([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(
                    `https://touching-man-22.hasura.app/api/rest/getuserexpenseswithcategory?user_id=${user.id}`,
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
                    throw new Error(data.message || "Failed to fetch expenses");
                }

                setExpenses(data.expense || []);
            } catch (error) {
                console.error("Error fetching expenses:", error);
                toast({
                    title: "Error",
                    description: "Failed to load expenses",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchExpenses();
    }, [user?.id, toast]);

    const handleSaveExpense = async (values: FormValues) => {
        if (!user?.id) {
            toast({
                title: "Error",
                description: "Please login to add expense",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("https://touching-man-22.hasura.app/api/rest/addexpense", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-hasura-admin-secret":
                        "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb",
                },
                body: JSON.stringify({
                    expense_amt: values.expense_amt,
                    user_id: user.id,
                    category_id: values.category_id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to add expense");
            }

            const newExpenseItem = {
                id: data.id || Date.now().toString(),
                expense_amt: values.expense_amt,
                created_date: new Date().toISOString().split("T")[0],
                category: categories.find(cat => cat.id === values.category_id) || {
                    id: values.category_id,
                    name: "Unknown",
                },
            };

            setExpenses(prev => [...prev, newExpenseItem]);
            form.reset({ expense_amt: 0, category_id: categories[0]?.id || "" });
            setIsAddDialogOpen(false);

            toast({
                title: "Success",
                description: "Expense added successfully",
            });
        } catch (error) {
            console.error("Error adding expense:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add expense",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditExpense = async (values: FormValues) => {
        if (!user?.id || !editExpense?.id) {
            toast({
                title: "Error",
                description: "Invalid user or expense",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                "https://touching-man-22.hasura.app/api/rest/updateexpense",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret":
                            "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb",
                    },
                    body: JSON.stringify({
                        id: editExpense.id,
                        user_id: user.id,
                        expense_amt: values.expense_amt,
                        category_id: values.category_id,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update expense");
            }

            if (data.update_expense?.affected_rows !== 1) {
                throw new Error("No rows affected or unexpected response");
            }

            // Update local state with the new expense data
            setExpenses(prev =>
                prev.map(exp =>
                    exp.id === editExpense.id
                        ? {
                            ...exp,
                            expense_amt: values.expense_amt,
                            category: categories.find(cat => cat.id === values.category_id) || exp.category,
                        }
                        : exp
                )
            );
            setEditExpense(null);
            setIsEditDialogOpen(false);

            toast({
                title: "Success",
                description: "Expense updated successfully",
            });
        } catch (error) {
            console.error("Error updating expense:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update expense",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!user?.id) {
            toast({
                title: "Error",
                description: "Please login to delete expenses",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                `https://touching-man-22.hasura.app/api/rest/deleteexpense?id=${id}&user_id=${user.id}`,
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
            console.log("Delete response:", data); // Log for debugging

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete expense");
            }

            if (data.delete_expense?.affected_rows === 1 || response.status === 200) {
                setExpenses(prev => prev.filter(exp => exp.id !== id));
                toast({
                    title: "Success",
                    description: "Expense deleted successfully",
                });
            } else {
                throw new Error("No rows affected or unexpected response");
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete expense",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE);
    const paginatedExpenses = expenses.slice(
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
                <h1 className="text-2xl font-bold">Expense Master</h1>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isLoading}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {isLoading ? "Loading..." : "Add Expense"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Expense</DialogTitle>
                            <DialogDescription>Record a new expense entry.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSaveExpense)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="expense_amt"
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
                                <FormField
                                    control={form.control}
                                    name="category_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={isLoading || categories.length === 0}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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
                {isLoading && expenses.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                        Loading expenses...
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                        {user ? "No expenses found" : "Please login to view expenses"}
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr No.</TableHead>
                                    <TableHead>Expense Amount (₹)</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedExpenses.map((expense, index) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                                        <TableCell>₹{expense.expense_amt.toFixed(2)}</TableCell>
                                        <TableCell>{expense.category.name}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mr-2"
                                                onClick={() => {
                                                    setEditExpense(expense);
                                                    form.setValue("expense_amt", expense.expense_amt);
                                                    form.setValue("category_id", expense.category.id);
                                                    setIsEditDialogOpen(true);
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteExpense(expense.id)}
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

            {/* Edit Expense Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                        <DialogDescription>Update the expense details.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleEditExpense)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="expense_amt"
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
                            <FormField
                                control={form.control}
                                name="category_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={isLoading || categories.length === 0}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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

export default ExpensePage;