import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Gift, Calendar } from "lucide-react";
import type { DetectedEventRow } from "@/hooks/useCalendarData";

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-red-100 text-red-800 border-red-200",
};

interface DetectedEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: DetectedEventRow[];
  onApprove: (event: DetectedEventRow) => void;
  onDismiss: (eventId: string) => void;
}

const DetectedEventsDialog = ({
  open,
  onOpenChange,
  events,
  onApprove,
  onDismiss,
}: DetectedEventsDialogProps) => {
  if (events.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Detected Events
          </DialogTitle>
          <DialogDescription>
            {events.length} event{events.length !== 1 ? "s" : ""} found — approve to add to your calendar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-lg border bg-card space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    📅 {new Date(event.detected_date).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {event.source_subject && (
                    <p className="text-xs text-muted-foreground mt-1">
                      From: {event.source_type === "email" ? `📧 ${event.source_subject}` : `📄 ${event.source_subject}`}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={CONFIDENCE_COLORS[event.confidence] || ""}>
                  {event.confidence}
                </Badge>
              </div>
              {event.suggest_gift && event.gift_reason && (
                <div className="flex items-center gap-2 text-sm text-pink-700 bg-pink-50 px-3 py-1.5 rounded-md">
                  <Gift className="h-4 w-4" />
                  {event.gift_reason}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => onApprove(event)}
                  className="gap-1"
                >
                  <Check className="h-3 w-3" />
                  Add to Calendar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDismiss(event.id)}
                  className="gap-1"
                >
                  <X className="h-3 w-3" />
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetectedEventsDialog;
