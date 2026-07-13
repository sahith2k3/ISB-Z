import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useLocalStudent } from "@/hooks/use-local-student";
import { useListFriends, useListStudents, useGetStudent } from "@workspace/api-client-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/utils";
import { Search, MapPin, Users, LogOut, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { studentId, logout } = useLocalStudent();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: me } = useGetStudent(studentId!);
  const { data: friends, isLoading: friendsLoading } = useListFriends(studentId!);

  const { data: searchResults, isLoading: searchLoading } = useListStudents(
    { search: debouncedSearch, limit: 10 },
    {
      query: {
        enabled: searchOpen && debouncedSearch.length > 1,
        queryKey: ["searchStudents", debouncedSearch],
      },
    }
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="px-6 py-6 pb-4 shrink-0 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">ISBusy</h1>
          {me && (
            <p className="text-sm font-medium text-muted-foreground flex items-center capitalize">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              {me.campus}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="h-10 w-10 rounded-full bg-card border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={logout}
            className="h-10 w-10 rounded-full bg-card border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Friends List */}
      <main className="flex-1 overflow-y-auto px-6 pb-20">
        {friendsLoading ? (
          <div className="space-y-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 bg-card rounded-2xl p-4">
                <div className="h-14 w-14 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : friends?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center mt-20">
            <div className="h-20 w-20 bg-card rounded-full flex items-center justify-center mb-6">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display font-semibold mb-2">No friends yet</h2>
            <p className="text-muted-foreground max-w-[250px] mb-8">
              Add people from your cohort to see who's free right now.
            </p>
            <button
              onClick={() => setSearchOpen(true)}
              className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
            >
              Find People
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <AnimatePresence>
              {friends?.map((friend, i) => (
                <motion.div
                  key={friend.student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/student/${friend.student.id}`}
                    className="block relative overflow-hidden bg-card rounded-2xl border border-card-border p-4 hover:border-primary/50 transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar name={friend.student.name} className="h-14 w-14" />
                        <div
                          className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center ${
                            friend.isInClass ? "bg-destructive" : "bg-free"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-foreground truncate pr-2">
                            {friend.student.name}
                          </h3>
                          {friend.isInClass ? (
                            <Badge variant="destructive" className="shrink-0 text-[10px]">In Class</Badge>
                          ) : (
                            <Badge variant="free" className="shrink-0 text-[10px]">Free</Badge>
                          )}
                        </div>
                        
                        {friend.isInClass && friend.currentSession ? (
                          <div className="text-sm text-muted-foreground flex flex-col gap-0.5">
                            <span className="truncate">{friend.currentSession.courseCode}</span>
                            <span className="text-xs flex items-center gap-1 opacity-80">
                              <Clock className="h-3 w-3" />
                              Until {formatTime(friend.currentSession.endTime)}
                            </span>
                          </div>
                        ) : friend.nextSession ? (
                          <div className="text-sm text-muted-foreground flex flex-col gap-0.5">
                            <span className="truncate">Free until {formatTime(friend.nextSession.startTime)}</span>
                            <span className="text-xs flex items-center gap-1 opacity-80">
                              Next: {friend.nextSession.courseCode}
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span className="text-free opacity-80">Free for the rest of the day</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Global Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            <div className="px-6 py-6 pb-4 border-b flex items-center gap-3 bg-card">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search anyone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-background border-none shadow-none"
                />
              </div>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {searchQuery.length < 2 ? (
                <div className="text-center mt-10 text-muted-foreground">
                  <p>Search by name or email</p>
                </div>
              ) : searchLoading ? (
                <div className="text-center mt-10">
                  <p className="text-muted-foreground animate-pulse">Searching...</p>
                </div>
              ) : searchResults?.length === 0 ? (
                <div className="text-center mt-10 text-muted-foreground">
                  <p>No one found.</p>
                </div>
              ) : (
                searchResults?.map((s) => (
                  <Link
                    key={s.id}
                    href={`/student/${s.id}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-4 p-4 bg-card rounded-2xl border active:scale-[0.98]"
                  >
                    <Avatar name={s.name} className="h-12 w-12" />
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-semibold truncate">{s.name}</h3>
                      <p className="text-sm text-muted-foreground truncate capitalize flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {s.campus} • Sec {s.section}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
