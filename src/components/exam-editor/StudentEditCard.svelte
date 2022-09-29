<script lang="ts">
    import type { Student } from "src/scripts/working-data";

    export let student: Student;
</script>

<div class="student-edit-card">
    <input type="text" bind:value={student.name.first} placeholder="Vorname">
    <input type="text" bind:value={student.name.title} placeholder="(Titel)">
    <input type="text" bind:value={student.name.last} placeholder="Nachname">
</div>

<style>
    .student-edit-card {
        color: var(--bg-main);
        background-color: var(--color-blue);
        padding: var(--padding-normal);
        margin: var(--padding-normal);

        border-radius: var(--border-normal);
    }

    input {
        color: inherit;
        margin: var(--padding-small);
        background-color: var(--color-blue);
        filter: brightness(0.9);
    }
</style>