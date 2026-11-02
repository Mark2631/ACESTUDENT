"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

type Question = { prompt: string; options: string[]; answer: number; explanation: string };
const banks: Record<string, Question[]> = {
  "Business & economics": [
    {prompt:"What does opportunity cost measure?",options:["The money already spent","The next best alternative forgone","Total fixed costs","A product's selling price"],answer:1,explanation:"Opportunity cost is the value of the next best alternative given up when a choice is made."},
    {prompt:"When demand rises and supply stays constant, what normally happens to equilibrium price?",options:["It falls","It stays fixed","It rises","It becomes zero"],answer:2,explanation:"An increase in demand shifts the demand curve right, raising equilibrium price and quantity, all else equal."},
    {prompt:"Which statement best describes working capital?",options:["Current assets minus current liabilities","Total assets minus equity","Revenue minus expenses","Cash sales only"],answer:0,explanation:"Net working capital is current assets less current liabilities."},
    {prompt:"Which is an example of a variable cost in a bakery?",options:["Annual rent","Monthly insurance","Flour used for each cake","Business licence"],answer:2,explanation:"Flour usage changes with the volume of cakes produced, making it a variable cost."},
    {prompt:"What is the main purpose of a cash-flow statement?",options:["Show profitability only","Explain cash inflows and outflows","List shareholders","Calculate market share"],answer:1,explanation:"A cash-flow statement reports cash generated and used by operating, investing and financing activities."}
  ],
  "Business mathematics & statistics": [
    {prompt:"A unit sells 120 items at KSh 250 each. What is its total sales revenue?",options:["KSh 3,000","KSh 30,000","KSh 25,000","KSh 120,250"],answer:1,explanation:"Sales revenue equals selling price multiplied by quantity: 250 × 120 = KSh 30,000."},
    {prompt:"A product sells for KSh 800 and has a variable cost of KSh 500. What is its contribution per unit?",options:["KSh 300","KSh 500","KSh 800","KSh 1,300"],answer:0,explanation:"Contribution per unit is selling price less variable cost: 800 − 500 = KSh 300."},
    {prompt:"A student scores 60, 70 and 80 in three tests. What is the arithmetic mean?",options:["65","70","75","210"],answer:1,explanation:"The mean is the sum divided by the number of observations: (60 + 70 + 80) ÷ 3 = 70."},
    {prompt:"If fixed costs are KSh 24,000 and contribution is KSh 400 per unit, what is the break-even output?",options:["40 units","50 units","60 units","80 units"],answer:2,explanation:"Break-even quantity equals fixed costs divided by contribution per unit: 24,000 ÷ 400 = 60 units."},
    {prompt:"A KSh 2,000 item is discounted by 10%. What is the new price?",options:["KSh 1,600","KSh 1,700","KSh 1,800","KSh 1,900"],answer:2,explanation:"Ten per cent of 2,000 is 200, so the discounted price is KSh 1,800."}
  ]
};
