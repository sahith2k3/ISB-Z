import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useLocalStudent } from '@/hooks/use-local-student';

import Home from '@/pages/home';
import Onboarding from '@/pages/onboarding';
import StudentProfile from '@/pages/student-profile';

const queryClient = new QueryClient();

function AppRouter() {
  const { studentId } = useLocalStudent();

  if (!studentId) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-[100dvh] max-w-md mx-auto bg-background shadow-xl shadow-black/5 relative overflow-hidden flex flex-col">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/student/:id" component={StudentProfile} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
