import {createEmptyCard,fsrs,Rating,State,type Card as FSRSCard,type CardInput} from "ts-fsrs";

export type PersistedFSRSCard={
 due:string;
 stability:number;
 difficulty:number;
 elapsed_days:number;
 scheduled_days:number;
 learning_steps:number;
 reps:number;
 lapses:number;
 state:0|1|2|3;
 last_review:string|null;
};
export type LegacyReviewState={next:number;interval:number;ease:number;reviews:number;lapses?:number;lastReviewed?:number};
export type ReviewGrade=0|1|2|3;

const scheduler=fsrs({
 request_retention:0.9,
 maximum_interval:36500,
 enable_fuzz:true,
 enable_short_term:true,
 learning_steps:["1m","10m"],
 relearning_steps:["10m"]
});
const DAY=24*60*60*1000;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export function isPersistedFSRSCard(value:unknown):value is PersistedFSRSCard{
 if(!value||typeof value!=="object")return false;
 const card=value as Partial<PersistedFSRSCard>;
 return typeof card.due==="string"&&Number.isFinite(Date.parse(card.due))
  &&typeof card.stability==="number"&&Number.isFinite(card.stability)&&card.stability>=0
  &&typeof card.difficulty==="number"&&Number.isFinite(card.difficulty)&&card.difficulty>=0&&card.difficulty<=10
  &&typeof card.elapsed_days==="number"&&Number.isFinite(card.elapsed_days)&&card.elapsed_days>=0
  &&typeof card.scheduled_days==="number"&&Number.isFinite(card.scheduled_days)&&card.scheduled_days>=0
  &&typeof card.learning_steps==="number"&&Number.isInteger(card.learning_steps)&&card.learning_steps>=0
  &&typeof card.reps==="number"&&Number.isInteger(card.reps)&&card.reps>=0
  &&typeof card.lapses==="number"&&Number.isInteger(card.lapses)&&card.lapses>=0
  &&typeof card.state==="number"&&Number.isInteger(card.state)&&card.state>=0&&card.state<=3
  &&(card.last_review===null||typeof card.last_review==="string"&&Number.isFinite(Date.parse(card.last_review)));
}
function toInput(card:PersistedFSRSCard):CardInput{
 return {...card,due:new Date(card.due),last_review:card.last_review?new Date(card.last_review):null};
}
function toPersisted(card:FSRSCard):PersistedFSRSCard{
 return {due:card.due.toISOString(),stability:card.stability,difficulty:card.difficulty,elapsed_days:card.elapsed_days,scheduled_days:card.scheduled_days,learning_steps:card.learning_steps,reps:card.reps,lapses:card.lapses,state:card.state,last_review:card.last_review?.toISOString()??null};
}
function fromLegacy(legacy:LegacyReviewState,now:number):CardInput{
 const lastReviewed=Number.isFinite(legacy.lastReviewed)?Math.min(now,legacy.lastReviewed!):Math.min(now,legacy.next-Math.max(1,legacy.interval)*DAY);
 return {
  due:new Date(Number.isFinite(legacy.next)&&legacy.next>0?legacy.next:now),
  stability:Math.max(0.1,Number.isFinite(legacy.interval)?legacy.interval:1),
  difficulty:clamp(5+(2.5-(Number.isFinite(legacy.ease)?legacy.ease:2.5))*2,1,10),
  elapsed_days:Math.max(0,(now-lastReviewed)/DAY),
  scheduled_days:Math.max(0,Number.isFinite(legacy.interval)?legacy.interval:0),
  learning_steps:0,
  reps:Math.max(1,Math.floor(legacy.reviews||1)),
  lapses:Math.max(0,Math.floor(legacy.lapses||0)),
  state:State.Review,
  last_review:new Date(lastReviewed)
 };
}
export function scheduleFSRSReview(
 saved:PersistedFSRSCard|undefined,
 legacy:LegacyReviewState,
 grade:ReviewGrade,
 now:number=Date.now()
):{memory:PersistedFSRSCard;dueAt:number;scheduledDays:number;difficulty:number;repetitions:number;lapses:number}{
 const card:CardInput=saved&&isPersistedFSRSCard(saved)?toInput(saved):legacy.reviews>0?fromLegacy(legacy,now):createEmptyCard(new Date(now));
 const rating=[Rating.Again,Rating.Hard,Rating.Good,Rating.Easy][grade];
 const result=scheduler.next(card,new Date(now),rating);
 const memory=toPersisted(result.card);
 return {memory,dueAt:result.card.due.getTime(),scheduledDays:result.card.scheduled_days,difficulty:result.card.difficulty,repetitions:result.card.reps,lapses:result.card.lapses};
}
export type FSRSSchedulePreview={again:number;hard:number;good:number;easy:number};
export function getFSRSSchedulePreview(saved:PersistedFSRSCard|undefined,legacy:LegacyReviewState,now:number=Date.now()):FSRSSchedulePreview{
 const card:CardInput=saved&&isPersistedFSRSCard(saved)?toInput(saved):legacy.reviews>0?fromLegacy(legacy,now):createEmptyCard(new Date(now));
 const preview=scheduler.repeat(card,new Date(now));
 return {again:preview[Rating.Again].card.due.getTime(),hard:preview[Rating.Hard].card.due.getTime(),good:preview[Rating.Good].card.due.getTime(),easy:preview[Rating.Easy].card.due.getTime()};
}
export function getRetrievability(memory:PersistedFSRSCard|undefined,now:number=Date.now()):number|null{
 if(!memory||!isPersistedFSRSCard(memory)||!memory.last_review)return null;
 const elapsed=Math.max(0,(now-Date.parse(memory.last_review))/DAY);
 return scheduler.get_retrievability(toInput(memory),new Date(now),false);
}
