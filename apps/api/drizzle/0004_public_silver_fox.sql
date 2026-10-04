ALTER TABLE `grade` ADD `timetable_id` integer NOT NULL REFERENCES timetable(id);--> statement-breakpoint
ALTER TABLE `room` ADD `timetable_id` integer NOT NULL REFERENCES timetable(id);--> statement-breakpoint
ALTER TABLE `class` ADD `timetable_id` integer NOT NULL REFERENCES timetable(id);--> statement-breakpoint
ALTER TABLE `student` ADD `timetable_id` integer NOT NULL REFERENCES timetable(id);--> statement-breakpoint
ALTER TABLE `subject` ADD `timetable_id` integer NOT NULL REFERENCES timetable(id);--> statement-breakpoint
ALTER TABLE `teacher` ADD `timetable_id` integer NOT NULL REFERENCES timetable(id);