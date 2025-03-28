import {
    ChevronDown,
    LayoutDashboard,
    Settings,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { Link } from "react-router-dom";

export function AppSidebar() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={window.location.pathname === "/dashboard"}>
                                    <Link to="/dashboard">
                                        <LayoutDashboard />
                                        <span>Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => setIsOpen(!isOpen)}
                                >
                                    <Settings />
                                    <span>Masters</span>
                                    <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                </SidebarMenuButton>

                                {isOpen && (
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={window.location.pathname === "/category"}
                                            >
                                                <Link to="/category">Category</Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={window.location.pathname === "/income"}
                                            >
                                                <Link to="/income">Income</Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={window.location.pathname === "/expense"}
                                            >
                                                <Link to="/expense">Expense</Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                )}
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}