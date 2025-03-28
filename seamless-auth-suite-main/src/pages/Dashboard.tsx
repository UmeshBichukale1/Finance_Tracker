import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, PieChart, Pie, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { LogOut, DollarSign, TrendingDown, Wallet, ArrowUp, ArrowDown } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

// Mock data for monthly comparison (keeping this as is for now)
const mockMonthlyData = [
  { name: "Jan", income: 5800, expenses: 3100 },
  { name: "Feb", income: 6200, expenses: 3300 },
  { name: "Mar", income: 6000, expenses: 3200 },
  { name: "Apr", income: 6800, expenses: 3400 },
  { name: "May", income: 7000, expenses: 3500 },
  { name: "Jun", income: 7300, expenses: 3600 },
];

// Colors for the pie charts
const INCOME_COLORS = ["#8884d8", "#9b87f5", "#7E69AB", "#6E59A5"];
const EXPENSE_COLORS = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc"];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch total income and total expenses from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        // Fetch Total Income
        const incomeResponse = await fetch(
          `https://touching-man-22.hasura.app/api/rest/gettotalincome?user_id=${user.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-hasura-admin-secret": "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb",
            },
          }
        );

        const incomeData = await incomeResponse.json();
        if (!incomeResponse.ok) {
          throw new Error("Failed to fetch total income");
        }
        const income = incomeData.income_aggregate.aggregate.sum.income_amt || 0;

        // Fetch Total Expenses
        const expenseResponse = await fetch(
          `https://touching-man-22.hasura.app/api/rest/gettotalexpense?user_id=${user.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-hasura-admin-secret": "dnm8M2e0iTYEmL6CmvDemDLr9E92gAI19Is3cXmqgtGK4CaMacP4sH8Sp9zVRmOb",
            },
          }
        );

        const expenseData = await expenseResponse.json();
        if (!expenseResponse.ok) {
          throw new Error("Failed to fetch total expenses");
        }
        const expenses = expenseData.expense_aggregate.aggregate.sum.expense_amt || 0;

        // Set states
        setTotalIncome(income);
        setTotalExpenses(expenses);
        setBalance(income - expenses); // Simply calculate balance as income - expenses

        // Mock income categories (for pie chart)
        const incomeCategories = [
          { category: "Salary", amount: income * 0.6 },
          { category: "Investments", amount: income * 0.2 },
          { category: "Freelance", amount: income * 0.15 },
          { category: "Other", amount: income * 0.05 },
        ];
        setIncomeData(incomeCategories);

        // Mock expense categories (for pie chart, replace with real data later if available)
        const expenseCategories = [
          { category: "Housing", amount: expenses * 0.4 },
          { category: "Food", amount: expenses * 0.25 },
          { category: "Transportation", amount: expenses * 0.15 },
          { category: "Utilities", amount: expenses * 0.1 },
          { category: "Entertainment", amount: expenses * 0.05 },
          { category: "Healthcare", amount: expenses * 0.05 },
        ];
        setExpenseData(expenseCategories);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Fallback to mock data
        const fallbackIncome = 7300;
        const fallbackExpenses = 2503; // From your API example
        setTotalIncome(fallbackIncome);
        setTotalExpenses(fallbackExpenses);
        setBalance(fallbackIncome - fallbackExpenses); // Calculate balance for fallback

        setIncomeData([
          { category: "Salary", amount: 5000 },
          { category: "Investments", amount: 1200 },
          { category: "Freelance", amount: 800 },
          { category: "Other", amount: 300 },
        ]);

        setExpenseData([
          { category: "Housing", amount: 1000 },
          { category: "Food", amount: 600 },
          { category: "Transportation", amount: 400 },
          { category: "Utilities", amount: 300 },
          { category: "Entertainment", amount: 200 },
          { category: "Healthcare", amount: 150 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="px-4 py-6">
          <div className="container mx-auto">
            {/* Header */}
            <header className="bg-indigo-600 text-white p-4 shadow-md">
              <div className="container mx-auto flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">FinanceTracker</h1>
                  <p className="text-indigo-200">Welcome, {user?.username}</p>
                </div>
                <Button variant="outline" className="text-black border-white hover:bg-indigo-700" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </div>
            </header>

            <main className="container mx-auto p-4 space-y-6">
              <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-green-600 flex items-center">
                      ₹ Total Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      {isLoading ? (
                        <p className="text-3xl font-bold">Loading...</p>
                      ) : (
                        <>
                          <p className="text-3xl font-bold">₹{totalIncome.toLocaleString()}</p>
                          <span className="ml-2 text-green-500 flex items-center text-sm">
                            <ArrowUp className="h-4 w-4" />
                          </span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-red-600 flex items-center">
                      <TrendingDown className="mr-2 h-5 w-5" /> Total Expenses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      {isLoading ? (
                        <p className="text-3xl font-bold">Loading...</p>
                      ) : (
                        <>
                          <p className="text-3xl font-bold">₹{totalExpenses.toLocaleString()}</p>
                          <span className="ml-2 text-red-500 flex items-center text-sm">
                            <ArrowDown className="h-4 w-4" />
                          </span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-blue-600 flex items-center">
                      <Wallet className="mr-2 h-5 w-5" /> Current Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-3xl font-bold">Loading...</p>
                    ) : (
                      <p className="text-3xl font-bold">{balance.toLocaleString()}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Income vs Expenses */}
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Monthly Income vs Expenses</CardTitle>
                    <CardDescription>Last 6 months comparison</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockMonthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, ""]} />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill="#8884d8" />
                        <Bar dataKey="expenses" name="Expenses" fill="#f87171" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Income and Expense Categories */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Income Breakdown */}
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle>Income Breakdown</CardTitle>
                      <CardDescription>By category</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={incomeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {incomeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${value}`, ""]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Expense Breakdown */}
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle>Expense Breakdown</CardTitle>
                      <CardDescription>By category</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#f87171"
                            dataKey="amount"
                          >
                            {expenseData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${value}`, ""]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;