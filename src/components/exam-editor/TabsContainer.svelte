<script lang="ts">
    import { newStudent } from "../../scripts/controller";
    import type { Student, Teacher } from "src/scripts/working-data";
    import TabbedView from "../../lib/TabbedView.svelte";
    import StudentEditCard from "./StudentEditCard.svelte";

    export let students: Student[];
    export let teachers: Teacher[];

    let currentTab: string = "Schüler";
</script>

<div class="tabs-container">
    <TabbedView bind:currentTab={currentTab} tabs={["Schüler", "Lehrer"]}>
        {#if currentTab === "Schüler"}
            <div class="card-container">
                {#each students as student}
                    <StudentEditCard bind:student={student}/> 
                {/each}
            </div>
            <div class="add-btn" on:click={_ => newStudent()}>+</div>
        {:else if currentTab === "Lehrer"}

            <div class="add-btn" on:click={_ => newStudent()}>+</div>
        {/if}
    </TabbedView>
</div>

<style>
    .add-btn {
        background-color: var(--bg-sec);
        padding: var(--padding-large);
        margin: var(--padding-large);
        font-size: 2rem;
        text-align: center;
        border-radius: var(--border-normal);
        user-select: none;

        position: sticky;
        bottom: var(--padding-large);
    }

    .tabs-container {
        overflow: hidden;
        position: relative;
    }

    .card-container {
        overflow: auto;
    }
</style>