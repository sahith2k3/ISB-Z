"use client";

import { useState, useEffect } from "react";
import { useLocalStudent } from "@/hooks/use-local-student";
import { Input } from "@/components/ui/input";
import { useListStudents } from "@/lib/api-client";
import { Search, MapPin, CheckCircle2, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import type { Campus } from "@/lib/types";

export function OnboardingView() {
  const { login } = useLocalStudent();
  const [campus, setCampus] = useState<Campus | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: students, isLoading } = useListStudents(
    { campus: campus || undefined, search: debouncedSearch, limit: 10 },
    {
      query: {
        enabled: !!campus && debouncedSearch.length > 1,
        queryKey: ["onboardingSearchStudents", campus, debouncedSearch],
      },
    },
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <div className="flex-1 overflow-y-auto px-6 py-12 flex flex-col">
        <AnimatePresence mode="wait">
          {!campus ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
            >
              <div className="mb-10 text-center">
                <h1 className="text-4xl font-display font-bold text-primary mb-3">
                  ISBusy
                </h1>
                <p className="text-muted-foreground text-lg">
                  Who&apos;s free for chai right now?
                </p>
              </div>

              <div className="space-y-4 w-full">
                <p className="font-semibold text-center mb-6 text-foreground">
                  Which campus are you at?
                </p>
                <button
                  onClick={() => setCampus("hyderabad")}
                  className="w-full relative overflow-hidden group flex flex-col items-center justify-center p-6 bg-card border-2 border-card-border rounded-2xl hover:border-primary transition-colors active:scale-[0.98]"
                >
                  <MapPin className="h-8 w-8 text-primary mb-3" />
                  <span className="font-display font-semibold text-xl">
                    Hyderabad
                  </span>
                </button>
                <button
                  onClick={() => setCampus("mohali")}
                  className="w-full relative overflow-hidden group flex flex-col items-center justify-center p-6 bg-card border-2 border-card-border rounded-2xl hover:border-primary transition-colors active:scale-[0.98]"
                >
                  <MapPin className="h-8 w-8 text-primary mb-3" />
                  <span className="font-display font-semibold text-xl">
                    Mohali
                  </span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full w-full"
            >
              <button
                onClick={() => setCampus(null)}
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Campus
              </button>

              <h2 className="text-3xl font-display font-bold mb-2">
                Find Yourself
              </h2>
              <p className="text-muted-foreground mb-6">
                Search the {campus === "hyderabad" ? "Hyderabad" : "Mohali"}{" "}
                roster to set up your profile.
              </p>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-14 text-lg bg-card rounded-2xl shadow-sm"
                />
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 space-y-3">
                {!search || search.length < 2 ? (
                  <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
                    <Search className="h-8 w-8 mb-3 opacity-20" />
                    <p>Type at least 2 characters to search</p>
                  </div>
                ) : isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse bg-card/50 rounded-2xl p-4 h-20"
                      />
                    ))}
                  </div>
                ) : students?.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p>No students found matching &quot;{search}&quot;</p>
                  </div>
                ) : (
                  students?.map((student) => (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={student.id}
                      onClick={() => login(student.id, student.campus)}
                      className="w-full flex items-center p-4 bg-card rounded-2xl border hover:border-primary transition-all text-left group active:scale-[0.98]"
                    >
                      <Avatar
                        name={student.name}
                        className="h-12 w-12 mr-4 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      />
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-semibold text-foreground truncate">
                          {student.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          Sec {student.section} • {student.email}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
