// controller.ts

import { DateTime, Duration, Interval } from "luxon";
import { writable, type Writable } from "svelte/store";
import { Calendar } from "./calendar";
import type * as Save from "./save-data";
import type { ViewData } from "./view-data";
import type * as Working from "./working-data";

import { invoke } from "@tauri-apps/api/tauri";
import { solve } from "./solve";

let currentPath: string | undefined = undefined;
let selectedDay: DateTime;
let workingData: Working.Data = {
    finishedExams: [],
    remainingExams: [],
    rooms: [],
    students: [],
    teachers: [],
    timetable: [
        { start: DateTime.fromObject({ hour:  8, minute:  0 }), duration: Duration.fromObject({ minutes: 45 }) },
        { start: DateTime.fromObject({ hour:  8, minute: 50 }), duration: Duration.fromObject({ minutes: 45 }) },
        { start: DateTime.fromObject({ hour:  9, minute: 40 }), duration: Duration.fromObject({ minutes: 45 }) },
        { start: DateTime.fromObject({ hour: 10, minute: 40 }), duration: Duration.fromObject({ minutes: 45 }) },
        { start: DateTime.fromObject({ hour: 11, minute: 30 }), duration: Duration.fromObject({ minutes: 45 }) },
        { start: DateTime.fromObject({ hour: 12, minute: 15 }), duration: Duration.fromObject({ minutes: 45 }) },
        { start: DateTime.fromObject({ hour: 13, minute:  5 }), duration: Duration.fromObject({ minutes: 45 }) },
        { start: DateTime.fromObject({ hour: 13, minute: 55 }), duration: Duration.fromObject({ minutes: 45 }) },
        { start: DateTime.fromObject({ hour: 14, minute: 45 }), duration: Duration.fromObject({ minutes: 45 }) },
        { start: DateTime.fromObject({ hour: 15, minute: 30 }), duration: Duration.fromObject({ minutes: 45 }) },
        { start: DateTime.fromObject({ hour: 16, minute: 15 }), duration: Duration.fromObject({ minutes: 45 }) },
    ],
};

let store: Writable<ViewData> = writable({
    day: DateTime.now(),
    rooms: [],
    remainingExams: [],
    teachers: [],
    students: [],
    timetable: [],
});
let currentProjectName: string;

function grabExamByUuid(uuid: string): Working.Exam {
    let idx = workingData.remainingExams.findIndex(v => v.uuid === uuid);
    return workingData.remainingExams.splice(idx, 1)[0];
}
function getRoomByUuid(uuid: string): Working.Room {
    return workingData.rooms.find(v => v.uuid === uuid);
}
// exams
function insertExam(examUuid: string, roomUuid: string, time: DateTime): void {
    let exam = grabExamByUuid(examUuid);
    let room = getRoomByUuid(roomUuid);

    room.calendar.book(time, exam.duration, exam);
    exam.examinees.forEach(v => v.calendar.book(time, exam.duration, exam));
    exam.examiners.forEach(v => v?.calendar.book(time, exam.duration, exam));
    workingData.finishedExams.push(<Working.Booked<Working.Exam>> {
        room,
        time: time,
        value: exam,
    });
    updateViewData();
}
function removeExam(examUuid: string): void {
    let idx = workingData.finishedExams.findIndex(v => v.value.uuid === examUuid);
    let exam = workingData.finishedExams.splice(idx, 1)[0];

    exam.room.calendar.unbook(v => v.uuid === examUuid);
    exam.value.examinees.forEach(v => v.calendar.unbook(v => v.uuid === examUuid));
    exam.value.examiners.forEach(v => v?.calendar.unbook(v => v.uuid === examUuid));

    workingData.remainingExams.push(exam.value);
    updateViewData();
}

function* slots() {
    for(const room of workingData.rooms) {
        for(const slot of workingData.timetable) {
            yield {
                room,
                slot,
            }
        }
    }
}

function computeExams(): void {

    let result = solve(
        workingData.remainingExams,
        slots,
        (exam, { room, slot }) => {
            insertExam(exam.uuid, room.uuid, slot.start);
        },
        // hard constraints
        [
            // no overlapping exams
            (exam, { room, slot }) => !room.calendar.isBooked(slot.start, exam.duration),
            // required tags must be used
            (exam, { room, slot }) => !exam.tags.find(v => v.required && !room.tags.includes(v.name)),
            // ! exam must have examiner
            // (exam, { room, slot }) => !!exam.examiners[0],

            // participants dont have other exams at the same time
            (exam, { room, slot }) => {
                if(exam.examiners.filter(v => !!v).find(v => v.calendar.isBooked(slot.start, exam.duration))) { return false }
                if(exam.examinees.find(v => v.calendar.isBooked(slot.start, exam.duration))) { return false }
                return true
            },
        ],
        // soft constraints
        [
            // try to match tags of the exams
            (exam, { room, slot }) => exam.tags.reduce((acc, v) => room.tags.includes(v.name) ? (v.required ? 20 : 10) + acc : acc, 0),
            // longer exams rank heigher
            (exam, { room, slot }) => exam.duration.as("minutes"),
        ],
    );
}

function newStudent() {
    workingData.students.push({
        calendar: new Calendar(),
        name: {
            first: "",
            last: "",
            title: undefined,
            uuid: crypto.randomUUID(),
        }
    });
    updateViewData();
}

// writers
function insertWriter(examUuid: string, writerUuid: string): void {

}
function removeWriter(examUuid: string): void {

}

function computeWriters(): void {

}

// secondary examiners
function insertSecondaryExaminer(examUuid: string, examinerUuid: string): void {

}
function removeSecondaryExaminer(examUuid: string): void {

}

function computeSecondaryExaminers(): void {

}

// verification
function verify(): void {

}

function addRoom(): void {
    workingData.rooms.push(<Working.Room>{
        calendar: new Calendar(),
        number: "",
        tags: [],
        uuid: crypto.randomUUID(),
    });
    updateViewData();
}
function setRoomNumber(uuid: string, number: string): void {
    workingData.rooms.find(v => v.uuid === uuid).number = number;
    updateViewData();
}

function addExam(): void {
    workingData.remainingExams.push(<Working.Exam>{
        uuid: crypto.randomUUID(),
        examinees: [],
        examiners: [undefined, undefined, undefined],
        id: "",
        duration: Duration.fromMillis(0),
        mainSubject: "",
        pinned: false,
        tags: [],
    });
    updateViewData();
}

// ? select the current day 
function selectDay({ year, month, day }: { year: number, month: number, day: number }): void {
    selectedDay = DateTime.fromObject({ year, month, day });
    updateViewData();
}

// save / load
async function save(path?: string) {
    if(!path && !currentPath) { alert("kein Pfad ausgewählt"); return }
    if(path) { currentPath = path }
    const examToSave = (v: Working.Exam) => (<Save.Exam>{
        uuid: v.uuid,
        id: v.id,
        duration: v.duration.toISO(),
        examinees: v.examinees.map(v => v?.name?.uuid),
        examiners: v.examiners.map(v => v?.name?.uuid),
        mainSubject: v.mainSubject,
        tags: v.tags,
    });

    let saveData: Save.FileFormat = {
        finishedExams: workingData.finishedExams.map(v => (<Save.Booked<Save.Exam>>{
            room: v.room.uuid,
            time: v.time.toISO(),
            value: examToSave(v.value),
        })),

        remainingExams: workingData.remainingExams.map(examToSave),
        rooms: workingData.rooms.map(v => ({
            uuid: v.uuid,
            number: v.number,
            tags: v.tags,
            calendar: v.calendar.toJSON(v => v.uuid),
        })),
        participants: {
            teachers: workingData.teachers.map(v => ({
                name: v.name,
                subjects: v.subjects,
                calendar: v.calendar.toJSON(v => v.uuid),
                shorthand: v.shorthand,
            })),
            students: workingData.students.map(v => ({
                name: v.name,
                calendar: v.calendar.toJSON(v => v.uuid),
            })),
        },

        timetable: workingData.timetable.map(v => ({
            start: v.start.toISO(),
            duration: v.duration.toISO(),
        })),
    };

    if(!await invoke<boolean>("save", { content: JSON.stringify(saveData), path: currentPath })) {
        alert("could not save file");
    }
}
async function load(path: string) {
    currentPath = path;
    let loadedData: Save.FileFormat = JSON.parse(await invoke("load", { path: currentPath }));

    let rooms = loadedData.rooms.map(v => (<Working.Room>{
        uuid: v.uuid,
        number: v.number,
        tags: v.tags,
        // calendar imported later
        calendar: v.calendar as any,
    }));

    const getRoomByUuid = (uuid: string) => rooms.find(v => v.uuid === uuid);

    let finishedExams = loadedData.finishedExams.map(v => (<Working.Booked<Working.Exam>>{
        room: getRoomByUuid(v.room),
        time: DateTime.fromISO(v.time), 
        value: {
            uuid: v.value.uuid,
            id: v.value.id,
            duration: Duration.fromISO(v.value.duration),
            
            mainSubject: v.value.mainSubject,
            tags: v.value.tags,
            pinned: v.value.pinned,

            // participants imported later
            examiners: v.value.examiners,
            examinees: v.value.examinees,
        } as any,
    }));

    const getExamByUuid = (uuid: string) => finishedExams.find(v => v.value.uuid === uuid);

    rooms.forEach(v => v.calendar = Calendar.fromJSON<Working.Exam, string>(v.calendar as any, v => getExamByUuid(v).value) as any);

    let students = loadedData.participants.students.map(v => (<Working.Student>{
        name: v.name,
        calendar: Calendar.fromJSON<Working.Exam, string>(v.calendar, v => getExamByUuid(v).value),
    }));

    const getStudentByUuid = (uuid: string) => students.find(v => v.name.uuid === uuid);

    let teachers = loadedData.participants.teachers.map(v => (<Working.Teacher>{
        name: v.name,
        subjects: v.subjects,
        calendar: Calendar.fromJSON<Working.Exam, string>(v.calendar, v => getExamByUuid(v).value),
    }));

    const getTeacherByUuid = (uuid: string) => teachers.find(v => v.name.uuid === uuid);

    let remainingExams = loadedData.remainingExams.map(v => (<Working.Exam>{
        uuid: v.uuid,
        id: v.id,
        duration: Duration.fromISO(v.duration),

        examinees: v.examinees.map(v => getStudentByUuid(v)),
        examiners: v.examiners.map(v => getTeacherByUuid(v)),
        pinned: v.pinned,
    }));

    let timetable: Working.Timetable = loadedData.timetable.map(v => ({
        duration: Duration.fromISO(v.duration),
        start: DateTime.fromISO(v.start),
    }));

    finishedExams.forEach(v => {
        v.value.examinees = v.value.examinees.map(v => getStudentByUuid(v as any));
        v.value.examiners = v.value.examiners.map(v => getTeacherByUuid(v as any)) as any;
    });

    workingData = <Working.Data>{
        remainingExams,
        finishedExams,

        rooms,
        teachers,
        students,
        timetable,
    };

    updateViewData(); 
}

// view data
function updateViewData(): void {
    let viewData: ViewData = {
        day: selectedDay,
        rooms: workingData.rooms.map((v) => ({
            uuid: v.uuid,
            number: v.number,
            tags: v.tags,
            slots: workingData.timetable.map((t, idx) => ({
                interval: Interval.after(t.start, t.duration),
                exam: v.calendar.getStarting(t.start)[0]?.event || undefined,
                conflicts: [],
                booked: v.calendar.isBooked(t.start, t.duration),
                idx, 
            })),
        })),

        remainingExams: workingData.remainingExams,
        teachers: workingData.teachers,
        students: workingData.students,
        timetable: [...(() => {
            let item = workingData.timetable[0];
            if(!item) { return [] }
            return [{
                start: item.start,
                duration: item.duration,
                padding: Duration.fromObject({}),
            }]
        })(),
        ...workingData.timetable.slice(1).map((v, i) => {
            let last = workingData.timetable[i];
            let lastEnd = last.start.plus(last.duration);
            let padding = lastEnd.diff(v.start);

            return {
                start: v.start,
                duration: v.duration,
                padding,
            }
        })],
    };

    store.set(viewData);
}

export {
    insertExam,
    removeExam,
    computeExams,

    insertWriter,
    removeWriter,
    computeWriters,

    insertSecondaryExaminer,
    removeSecondaryExaminer,
    computeSecondaryExaminers,

    addRoom,
    setRoomNumber,

    addExam,

    newStudent,
    currentPath,

    save,
    load,
    
    // vars
    store,
}