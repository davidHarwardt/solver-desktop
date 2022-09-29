import type { DateTime, Interval, Duration } from "luxon";
import type { Exam, Student, Teacher } from "./working-data";

type ViewConflict = {
    description: string,
};

type RoomSlot = {
    interval: Interval,
    exam?: Exam,
    conflicts: ViewConflict[],
    booked: boolean,
    idx: number,
}

type Room = {
    uuid: string,
    number: string,
    tags: string[],
    slots: RoomSlot[],
}

type Timetable = {
    start: DateTime,
    duration: Duration,
    padding: Duration,
}[]

type ViewData = {
    day: DateTime,
    rooms: Room[],

    remainingExams: Exam[],
    teachers: Teacher[],
    students: Student[],
    timetable: Timetable,
};

export type {
    ViewData,
    Room,
    Exam,
    RoomSlot,
    Timetable,
}