"use client";

type ChecklistTask = {
  id: string;
  name: string;
  description: string | null;
  scheduled_date: string | null;
  work_order_due_date?: string | null;
};

type ChecklistProperty = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
};

type MaintenanceChecklistPrintProps = {
  planName: string;
  planDescription: string | null;
  property?: ChecklistProperty | null;
  tasks: ChecklistTask[];
};

function formatPrintDate(date: string | null) {
  if (!date) {
    return null;
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPropertyLine(property?: ChecklistProperty | null) {
  if (!property) {
    return null;
  }

  const location = [property.address, property.city, property.state]
    .filter(Boolean)
    .join(", ");

  if (property.name && location) {
    return `${property.name} — ${location}`;
  }

  return property.name || location || null;
}

export default function MaintenanceChecklistPrint({
  planName,
  planDescription,
  property,
  tasks,
}: MaintenanceChecklistPrintProps) {
  const propertyLine = formatPropertyLine(property);
  const preparedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="hidden print-only print:block">
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0.55in;
          }

          html,
          body {
            background: #ffffff !important;
            color: #102a43 !important;
          }
        }
      `}</style>

      <header className="mb-6 border-b-2 border-[#102A43] pb-4">
        <div className="flex items-center gap-4">
          <img
            src="/brand/WaveLogo.png"
            alt="PropertyCare Pal"
            className="h-14 w-auto object-contain"
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#102A43]">
              PropertyCare Pal
            </p>
            <h1 className="text-2xl font-bold text-[#102A43]">
              Maintenance Checklist
            </h1>
          </div>
        </div>
      </header>

      <section className="mb-6">
        <h2 className="text-xl font-bold text-[#102A43]">{planName}</h2>

        {planDescription && (
          <p className="mt-2 text-sm leading-6 text-gray-700">{planDescription}</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {propertyLine && (
            <p>
              <span className="font-semibold text-[#102A43]">Property:</span>{" "}
              {propertyLine}
            </p>
          )}

          <p>
            <span className="font-semibold text-[#102A43]">Prepared:</span>{" "}
            {preparedDate}
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[#102A43]">
          Maintenance Tasks
        </h3>

        {tasks.length === 0 ? (
          <p className="text-sm text-gray-600">
            No maintenance tasks have been added to this plan yet.
          </p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const scheduledDate = formatPrintDate(
                task.work_order_due_date || task.scheduled_date
              );

              return (
                <article
                  key={task.id}
                  className="break-inside-avoid rounded-md border border-gray-400 p-4"
                >
                  <div className="flex items-start gap-4">
                    <div
                      aria-hidden="true"
                      className="mt-0.5 h-7 w-7 shrink-0 rounded-sm border-2 border-[#102A43]"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-[#102A43]">
                        {task.name}
                      </p>

                      {task.description && (
                        <p className="mt-1 text-sm leading-5 text-gray-700">
                          {task.description}
                        </p>
                      )}

                      {scheduledDate && (
                        <p className="mt-2 text-sm text-gray-700">
                          <span className="font-semibold">Scheduled:</span>{" "}
                          {scheduledDate}
                        </p>
                      )}

                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Notes
                        </p>
                        <div className="mt-1 min-h-[52px] border-b border-gray-400" />
                        <div className="mt-3 min-h-[20px] border-b border-gray-300" />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8 break-inside-avoid">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#102A43]">
          Property Manager Notes
        </h3>
        <div className="mt-2 min-h-[140px] border border-gray-400" />

        <p className="mt-6 text-sm">
          <span className="font-semibold text-[#102A43]">Date Completed:</span>
          <span className="ml-3 inline-block min-w-[220px] border-b border-gray-700">&nbsp;</span>
        </p>
      </section>
    </div>
  );
}
