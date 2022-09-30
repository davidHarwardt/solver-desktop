<script lang="ts">
    import { Duration } from "luxon";
    import type { Exam } from "src/scripts/view-data";


    export let exam: Exam;

    function updateDuration(ev: { currentTarget: HTMLInputElement }) {
        let value = ev.currentTarget.value.split(":");
        if(value.length === 1) {
            let parsed = parseInt(value[0]);
            if(!isNaN(parsed)) {
                exam.duration = Duration.fromObject({ minutes: parsed });
                return;
            }
        }
        if(value.length !== 2) { ev.currentTarget.value = "00:00"; return }
        let [hours, minutes] = value.map(v => parseInt(v));

        if(isNaN(hours) || isNaN(minutes)) { ev.currentTarget.value = "00:00"; return }
        exam.duration = Duration.fromObject({ hours, minutes });
    }
</script>

<div class="exam-edit-card">
    <input type="text" bind:value={exam.id} placeholder="id">
    <div>
        Dauer: <input type="text" pattern="(\d+:[0-5]?\d)|\d+" value={exam.duration.toFormat("hh:mm")} on:change={updateDuration}>
    </div>
    <div>
        <div>Schüler:</div>
        {#each exam.examinees as student}
            <div class="badge">{student.name}</div> 
        {/each}
        <input type="button" value="+">
    </div>
    <div>
        <div>Prüfer:</div>
        <div class="examiner-container">
            {#each exam.examiners as examiner}
                {#if examiner}
                    <div class="badge">{examiner.name}</div>
                {:else}
                    <div class="badge empty">+</div>
                {/if}
            {/each}
        </div>
    </div>
    <div>
        <div>Fach:</div>
        <input type="text" bind:value={exam.mainSubject} placeholder="Fach">
    </div>
</div>

<style>
    .exam-edit-card {
        color: var(--bg-main);
        background-color: var(--color-blue);
        padding: var(--padding-normal);
        border-radius: var(--border-normal);
        width: 20ch;
        height: fit-content;
        min-height: 9rem;
    } 

    .examiner-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--padding-small);
    }


    .badge {
        background-color: var(--color-blue);
        filter: brightness(0.9);
        border-radius: var(--border-small);
        display: inline-block;
        padding: var(--padding-normal);
        user-select: none;
    }

    .badge.empty {
        text-align: center;
    }

    input {
        margin: var(--padding-small);
        background-color: var(--color-blue);
        filter: brightness(0.9);
        max-width: 85%;
    }

    input:invalid {
        outline-color: var(--color-red);
    }
</style>