<script lang="ts">
    import { computeExams, load, save as controllerSave, currentPath } from "../scripts/controller";
    import { save, open } from "@tauri-apps/api/dialog";

    enum SelectedView {
        TimePlaner,
        ExamEditor,
    }

    export let onSelect: (v: "time-planer" | "exam-editor") => void;
    export let selectedView;

    function saveFn() {
        // save();
        if(currentPath) {
            controllerSave()
        } else {
            save({
                filters: [{
                    name: "Solver-Projekt",
                    extensions: ["json"],
                }]
            }).then(v => {
                if(v !== null) {
                    controllerSave(v)
                }
            });
        }
    }

    function loadFn() {
        // load();
        open({
            multiple: false,
            filters: [{
                name: "Solver-Projekt",
                extensions: ["json"],
            }],
        }).then(v => {
            if(v !== null) {
                load(v as string);
            }
        });
    }

    function computeFn() {
        computeExams();
    }

</script>

<div class="title-bar">
    <div class="title-left">
        <div class="new-btn btn" on:click={saveFn}>Neu</div>
        <div class="save-btn btn" on:click={saveFn}>Speichern</div>
        <div class="load-btn btn" on:click={loadFn}>Laden</div>
        <div class="compute-btn btn" on:click={computeFn}>Berechnen</div>
    </div>
    <div class="title-center">
        <div class="select-tab" on:click={_ => onSelect("time-planer")} class:active={selectedView === "time-planer"}>Räume</div>
        <div class="select-tab" on:click={_ => onSelect("exam-editor")} class:active={selectedView === "exam-editor"}>Prüfungen</div>
    </div>
    <div class="title-right"></div>
</div>

<style>
    .title-bar {
        background-color: var(--bg-sec);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
    }

    .title-center {
        text-align: center;
    }

    .active {
        outline: var(--fg-sec) 0.2rem solid;
    }

    .select-tab {
        display: inline-block;
        padding: var(--padding-normal);
        margin: var(--padding-small);
        background-color: var(--bg-main);
        border-radius: var(--border-small);
        transition: 0.125s ease-out;
        user-select: none;
        cursor: pointer;
    }

    .select-tab:hover, .btn:hover {
        filter: brightness(1.1);
    }

    .btn {
        display: inline-block;
        padding: var(--padding-normal);
        margin: var(--padding-small);
        background-color: var(--bg-main);
        border-radius: var(--border-small);
        transition: 0.125s ease-out;
        user-select: none;
        cursor: pointer;
    }
</style>