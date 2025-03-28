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
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface Category {
    id: string;
    name: string;
}

const ITEMS_PER_PAGE = 10;

const CategoryPage = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { toast } = useToast();

    // Fetch categories when component mounts or when user changes
    useEffect(() => {
        const fetchCategories = async () => {
            if (!user?.id) {
                setCategories([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(
                    `https://touching-man-22.hasura.app/api/rest/getcategories?user_id=${user.id}`,
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
            } catch (error) {
                console.error("Error fetching categories:", error);
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to load categories",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, [user, toast]);

    const handleSaveCategory = async () => {
        if (!newCategory.trim()) {
            toast({
                title: "Error",
                description: "Category name cannot be empty",
                variant: "destructive",
            });
            return;
        }

        if (!user?.id) {
            toast({
                title: "Error",
                description: "Please login to add categories",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                "https://touching-man-22.hasura.app/api/rest/addcategory",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret":
                            "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb",
                    },
                    body: JSON.stringify({
                        name: newCategory,
                        user_id: user.id,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to add category");
            }

            setCategories(prev => [...prev, { id: data.id || Date.now().toString(), name: newCategory }]);
            setNewCategory("");
            setIsAddDialogOpen(false);

            toast({
                title: "Success",
                description: "Category added successfully",
            });
        } catch (error) {
            console.error("Error adding category:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add category",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditCategory = async () => {
        if (!editCategory?.name.trim()) {
            toast({
                title: "Error",
                description: "Category name cannot be empty",
                variant: "destructive",
            });
            return;
        }

        if (!user?.id || !editCategory?.id) {
            toast({
                title: "Error",
                description: "Invalid user or category",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                "https://touching-man-22.hasura.app/api/rest/updatecategory",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret":
                            "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb",
                    },
                    body: JSON.stringify({
                        id: editCategory.id,
                        user_id: user.id,
                        name: editCategory.name,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update category");
            }

            if (data.update_categories?.affected_rows !== 1) {
                throw new Error("No rows affected or unexpected response");
            }

            // Update local state with the returned category data
            setCategories(prev =>
                prev.map(cat =>
                    cat.id === editCategory.id ? { ...cat, name: editCategory.name } : cat
                )
            );
            setEditCategory(null);
            setIsEditDialogOpen(false);

            toast({
                title: "Success",
                description: "Category updated successfully",
            });
        } catch (error) {
            console.error("Error updating category:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update category",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!user?.id) {
            toast({
                title: "Error",
                description: "Please login to delete categories",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                `https://touching-man-22.hasura.app/api/rest/deletecategory?id=${id}&user_id=${user.id}`,
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

            if (!response.ok || data.delete_categories?.affected_rows !== 1) {
                throw new Error(data.message || "Failed to delete category");
            }

            setCategories(prev => prev.filter(cat => cat.id !== id));
            toast({
                title: "Success",
                description: "Category deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting category:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete category",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
    const paginatedCategories = categories.slice(
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
                <h1 className="text-2xl font-bold">Category Master</h1>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                            <DialogDescription>
                                Create a new category for income and expenses.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="col-span-3"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleSaveCategory}
                                disabled={isLoading || !newCategory.trim()}
                            >
                                {isLoading ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                {isLoading && categories.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                        Loading categories...
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                        {user ? "No categories found" : "Please login to view categories"}
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr No.</TableHead>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedCategories.map((category, index) => (
                                    <TableRow key={category.id}>
                                        <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mr-2"
                                                onClick={() => {
                                                    setEditCategory(category);
                                                    setIsEditDialogOpen(true);
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteCategory(category.id)}
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

            {/* Edit Category Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>Update the category name.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="edit-name"
                                value={editCategory?.name || ""}
                                onChange={(e) =>
                                    setEditCategory(prev => (prev ? { ...prev, name: e.target.value } : null))
                                }
                                className="col-span-3"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleEditCategory}
                            disabled={isLoading || !editCategory?.name.trim()}
                        >
                            {isLoading ? "Updating..." : "Update"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CategoryPage;