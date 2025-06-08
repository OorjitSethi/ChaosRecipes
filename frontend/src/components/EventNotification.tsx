interface Props {
    title: string;
    description: string;
}

export const EventNotification = ({ title, description }: Props) => (
    <div 
        className="
            bg-indigo-50
            border-l-4 
            border-indigo-400
            text-indigo-800
            p-3
            rounded-r-md
            shadow-sm
        " 
        role="alert"
    >
        <p className="font-medium text-sm mb-1">{title}</p>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{description}</p>
    </div>
);