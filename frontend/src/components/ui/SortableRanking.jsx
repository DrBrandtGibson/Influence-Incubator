import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export const SortableRanking = ({ items, onChange, testIdPrefix = "ranking" }) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    function handleEnd(evt) {
        const { active, over } = evt;
        if (!over || active.id === over.id) return;
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        onChange(arrayMove(items, oldIndex, newIndex));
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2" data-testid={`${testIdPrefix}-list`}>
                    {items.map((label, i) => (
                        <SortableItem key={label} id={label} index={i} testIdPrefix={testIdPrefix} />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
};

function SortableItem({ id, index, testIdPrefix }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.85 : 1
    };
    return (
        <li
            ref={setNodeRef}
            style={style}
            className="editorial-card p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing select-none"
            data-testid={`${testIdPrefix}-item-${id.toLowerCase()}`}
            {...attributes}
            {...listeners}
        >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="h-7 w-7 rounded-full bg-brand-gold text-brand-charcoal grid place-items-center text-xs font-semibold">{index + 1}</span>
            <span className="font-serif text-base">{id}</span>
        </li>
    );
}
