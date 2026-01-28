import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Download, FileText, Video, Image, File } from "lucide-react";
import { DashboardLayout, studentNavItems } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface StudyMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  topic: string | null;
  subject_name: string;
  subject_code: string;
  faculty_name: string;
  created_at: string;
}

const StudentMaterials = () => {
  const { profile } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchMaterials();
    }
  }, [profile]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("study_materials")
        .select(`
          id,
          title,
          description,
          file_url,
          file_type,
          topic,
          created_at,
          subjects (
            name,
            code
          ),
          profiles (
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedMaterials = (data || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        file_url: m.file_url,
        file_type: m.file_type,
        topic: m.topic,
        subject_name: m.subjects?.name || "Unknown",
        subject_code: m.subjects?.code || "",
        faculty_name: `${m.profiles?.first_name || ""} ${m.profiles?.last_name || ""}`.trim() || "Unknown",
        created_at: m.created_at,
      }));

      setMaterials(formattedMaterials);
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const subjects = [...new Set(materials.map((m) => m.subject_code))];

  const filteredMaterials = materials.filter((m) => {
    const matchesSubject =
      selectedSubject === "all" || m.subject_code === selectedSubject;
    const matchesSearch =
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return File;
    if (fileType.includes("pdf")) return FileText;
    if (fileType.includes("video")) return Video;
    if (fileType.includes("image")) return Image;
    return File;
  };

  return (
    <DashboardLayout
      navItems={studentNavItems}
      title="Study Materials"
      subtitle="Access course materials and resources"
    >
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-4 text-center">
            <div className="p-2 rounded-lg bg-primary/10 w-fit mx-auto mb-2">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{materials.length}</p>
            <p className="text-xs text-muted-foreground">Total Materials</p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-4 text-center">
            <div className="p-2 rounded-lg bg-blue-500/10 w-fit mx-auto mb-2">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">
              {materials.filter((m) => m.file_type?.includes("pdf")).length}
            </p>
            <p className="text-xs text-muted-foreground">PDFs</p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-4 text-center">
            <div className="p-2 rounded-lg bg-purple-500/10 w-fit mx-auto mb-2">
              <Video className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">
              {materials.filter((m) => m.file_type?.includes("video")).length}
            </p>
            <p className="text-xs text-muted-foreground">Videos</p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-4 text-center">
            <div className="p-2 rounded-lg bg-green-500/10 w-fit mx-auto mb-2">
              <File className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{subjects.length}</p>
            <p className="text-xs text-muted-foreground">Subjects</p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Materials Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {filteredMaterials.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No materials found</p>
            <p className="text-muted-foreground">
              {searchQuery || selectedSubject !== "all"
                ? "Try adjusting your filters"
                : "No study materials have been uploaded yet"}
            </p>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((material, index) => {
              const FileIcon = getFileIcon(material.file_type);
              
              return (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index % 6) }}
                >
                  <GlassCard className="p-4 h-full flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{material.title}</h3>
                        <Badge variant="outline" className="text-xs mt-1">
                          {material.subject_code}
                        </Badge>
                      </div>
                    </div>

                    {material.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {material.description}
                      </p>
                    )}

                    {material.topic && (
                      <Badge variant="secondary" className="w-fit mb-3 text-xs">
                        {material.topic}
                      </Badge>
                    )}

                    <div className="mt-auto pt-3 border-t flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        <p>{material.faculty_name}</p>
                        <p>
                          {format(new Date(material.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default StudentMaterials;
