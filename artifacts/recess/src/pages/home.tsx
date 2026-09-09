import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useLocalStudent } from "@/hooks/use-local-student";
import { useListFriends, useListStudents, useGetStudent } from "@workspace/api-client-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/utils";
import { Search, MapPin, Users, LogOut, Clock, X, CalendarDays, ArrowUpRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StudentSchedule } from "@/components/student-schedule";

export default function Home() {
  const { studentId, logout } = useLocalStudent();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: me } = useGetStudent(studentId!);
  const {
    data: friends,
    isLoading: friendsLoading,
    isError: friendsError,
    refetch: refetchFriends,
  } = useListFriends(studentId!);

  const {
    data: searchResults,
    isLoading: searchLoading,
    isError: searchError,
  } = useListStudents(
    { search: debouncedSearch, limit: 10 },
    {
      query: {
        enabled: searchOpen && debouncedSearch.length > 1,
        queryKey: ["searchStudents", debouncedSearch],
      },
    }
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (searchOpen) setSearchOpen(false);
        if (scheduleOpen) setScheduleOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scheduleOpen, searchOpen]);

  useEffect(() => {
    document.body.style.overflow = scheduleOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [scheduleOpen, searchOpen]);

  const freeCount = friends?.filter((friend) => !friend.isInClass).length ?? 0;
  const classCount = friends?.filter((friend) => friend.isInClass).length ?? 0;

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-background/85 px-6 pb-5 pt-7 backdrop-blur-md">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/60">Campus, in sync</p>
          <h1 className="text-3xl font-display font-bold leading-none text-primary" data-testid="text-app-name">ISBusy</h1>
          {me && (
            <p className="mt-2 flex items-center text-sm font-medium capitalize text-muted-foreground" data-testid="text-campus">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              {me.campus}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search students"
            data-testid="button-open-search"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-card-border bg-card text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            data-testid="button-logout"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-card-border bg-card text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-destructive/50 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Friends List */}
      <main className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="mb-6 flex items-end justify-between gap-4 pt-1">
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">Your people</p>
            <h2 className="text-2xl font-display font-bold text-foreground" data-testid="text-friends-heading">Who's around?</h2>
          </div>
          {!friendsLoading && !friendsError && friends && friends.length > 0 && (
            <div className="text-right" data-testid="text-friend-summary">
              <p className="text-lg font-display font-bold text-free">{freeCount} free</p>
              <p className="text-xs font-medium text-muted-foreground">{classCount} in class</p>
            </div>
          )}
        </div>
        {friendsLoading ? (
          <div className="mt-4 space-y-4" data-testid="friends-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 rounded-2xl border border-card-border bg-card p-4">
                <div className="h-14 w-14 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : friendsError ? (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-primary/15 bg-card p-8 text-center" data-testid="friends-error">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-bold">The list took a detour</h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">We couldn't check who's around right now.</p>
            <button
              type="button"
              onClick={() => refetchFriends()}
              data-testid="button-retry-friends"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : friends?.length === 0 ? (
          <div className="mt-12 flex h-full flex-col items-center justify-center text-center" data-testid="friends-empty">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/10 bg-card">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-display font-semibold">No friends yet</h2>
            <p className="mb-8 max-w-[250px] text-muted-foreground">
              Add people from your cohort to see who's free right now.
            </p>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              data-testid="button-find-people"
              className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
            >
              Find People
            </button>
          </div>
        ) : (
          <div className="mt-2 space-y-3">
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
                    data-testid={`link-friend-${friend.student.id}`}
                    className="group relative block overflow-hidden rounded-2xl border border-card-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
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
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-primary/0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary/70" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Schedule edge handle */}
      <AnimatePresence>
        {!scheduleOpen && studentId && (
          <motion.button
            type="button"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            onClick={() => setScheduleOpen(true)}
            aria-label="Open my schedule"
            data-testid="button-open-schedule"
            className="group fixed right-0 top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 rounded-l-2xl border border-r-0 border-primary/15 bg-card/80 px-2 py-4 text-primary/55 shadow-sm backdrop-blur transition-all hover:bg-card hover:px-3 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.16em] [writing-mode:vertical-rl] sm:block">Schedule</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Global Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            aria-label="Search students"
            className="fixed inset-0 z-50 flex flex-col bg-background"
          >
            <div className="flex items-center gap-3 border-b border-card-border bg-card px-6 pb-4 pt-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  autoFocus
                  data-testid="input-search-students"
                  placeholder="Search anyone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-background border-none shadow-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                aria-label="Close search"
                data-testid="button-close-search"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                <div className="mt-4 space-y-3" data-testid="search-loading">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex animate-pulse items-center gap-4 rounded-2xl border border-card-border bg-card p-4">
                      <div className="h-12 w-12 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchError ? (
                <div className="mt-10 text-center text-muted-foreground" data-testid="search-error">
                  <p>Search is unavailable right now.</p>
                </div>
              ) : searchResults?.length === 0 ? (
                <div className="mt-10 text-center text-muted-foreground" data-testid="search-empty">
                  <p>No one found.</p>
                </div>
              ) : (
                searchResults?.map((s) => (
                  <Link
                    key={s.id}
                    href={`/student/${s.id}`}
                    onClick={() => setSearchOpen(false)}
                    data-testid={`link-search-result-${s.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-card-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
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

      {/* Full-screen schedule pane */}
      <AnimatePresence>
        {scheduleOpen && studentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="My schedule"
            className="fixed inset-0 z-40 overflow-y-auto bg-background"
          >
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ type: "spring", damping: 27, stiffness: 230 }}
              className="min-h-[100dvh] px-6 pb-12 pt-7 sm:px-10 sm:pt-10"
            >
              <div className="mx-auto mb-8 flex max-w-3xl items-center justify-between border-b border-primary/10 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Private view</p>
                    <p className="text-sm font-semibold text-muted-foreground">Just your classes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleOpen(false)}
                  aria-label="Close schedule"
                  data-testid="button-close-schedule-pane"
                  className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Done
                </button>
              </div>
              <StudentSchedule studentId={studentId} title="My Schedule" onClose={() => setScheduleOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
