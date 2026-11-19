import { BookOpen, Building2, FlaskConical, GraduationCap, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/campus-data";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  classroom: GraduationCap,
  lab: FlaskConical,
  office: Building2,
  facility: BookOpen,
};

export const CATEGORY_TONE: Record<Category, string> = {
  classroom: "bg-primary-soft text-primary",
  lab: "bg-emerald-soft text-emerald",
  office: "bg-landmark-soft text-landmark",
  facility: "bg-secondary text-secondary-foreground",
};
