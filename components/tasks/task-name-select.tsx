"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_NAME_OPTIONS } from "@/lib/task-utils";

interface TaskNameSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  extraOptions?: string[];
}

export function TaskNameSelect({ id, value, onChange, extraOptions = [] }: TaskNameSelectProps) {
  const options = [
    ...TASK_NAME_OPTIONS,
    ...extraOptions.filter(
      (name) => !TASK_NAME_OPTIONS.includes(name as (typeof TASK_NAME_OPTIONS)[number])
    ),
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Task Name</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select task name" />
        </SelectTrigger>
        <SelectContent>
          {options.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
