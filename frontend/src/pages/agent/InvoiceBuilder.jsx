import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Download, 
  Send, 
  CheckCircle2, 
  ChevronLeft,
  DollarSign,
  Percent,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const InvoiceBuilder = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([
    { id: 1, description: 'Strategic Consulting', quantity: 1, unitPrice: 1500 }
  ]);
  const [taxRate, setTaxRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount - discount;

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await api.post('/invoices', { items, taxRate, discount });
      toast.success('Invoice Deployed to Ledger');
      navigate('/agent/invoices');
    } catch (error) {
      toast.error('Deployment Failed');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      {/* HEADER */}
      <div className="flex items-center justify-between">
         <button 
           onClick={() => navigate(-1)}
           className="p-4 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
         >
            <ChevronLeft size={20} className="text-slate-600" />
         </button>
         <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase">Fiscal Architect</h1>
         <div className="flex gap-4">
            <button className="h-14 px-8 bg-white border border-slate-200/60 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all">
               <Download size={16} /> Save Draft
            </button>
            <button 
              onClick={handleDeploy}
              disabled={isDeploying}
              className="h-14 px-10 bg-[#0F172A] text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-2xl shadow-slate-300 hover:-translate-y-1 transition-all"
            >
               {isDeploying ? 'Deploying...' : <><Send size={16} /> Deploy Invoice</>}
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* BUILDER AREA */}
         <div className="lg:col-span-2 space-y-10">
            <div className="bg-white p-12 rounded-[48px] border border-slate-200/60 shadow-sm space-y-10">
               <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                  <div className="flex items-center gap-4">
                     <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                        <FileText size={24} />
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-[#0F172A] tracking-tight uppercase">Line Item Specifications</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Define project deliverables and fiscal values</p>
                     </div>
                  </div>
                  <button 
                    onClick={addItem}
                    className="p-4 bg-blue-600 text-white rounded-2xl hover:brightness-125 transition-all shadow-lg shadow-blue-200"
                  >
                     <Plus size={20} />
                  </button>
               </div>

               <div className="space-y-6">
                  {items.map((item, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={item.id} 
                      className="flex items-end gap-6 group"
                    >
                       <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Description</label>
                          <input 
                            className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="e.g. Enterprise License"
                          />
                       </div>
                       <div className="w-24 space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qty</label>
                          <input 
                            type="number"
                            className="w-full h-14 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-sm text-center"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                          />
                       </div>
                       <div className="w-40 space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Price</label>
                          <div className="relative">
                             <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                             <input 
                               type="number"
                               className="w-full h-14 pl-10 pr-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                               value={item.unitPrice}
                               onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                             />
                          </div>
                       </div>
                       <button 
                         onClick={() => removeItem(item.id)}
                         className="h-14 w-14 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                       >
                          <Trash2 size={18} />
                       </button>
                    </motion.div>
                  ))}
               </div>
            </div>

            <div className="bg-[#0F172A] p-10 rounded-[40px] text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
               <div className="relative z-10 flex items-center gap-8">
                  <div className="p-5 bg-white/10 rounded-3xl text-emerald-400">
                     <Calculator size={32} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Fiscal Value</p>
                     <h3 className="text-5xl font-black tracking-tighter tabular-nums">${total.toLocaleString()}</h3>
                  </div>
               </div>
               <div className="relative z-10 text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal: ${subtotal.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Tax Applied: ${taxAmount.toLocaleString()}</p>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32" />
            </div>
         </div>

         {/* SETTINGS AREA */}
         <div className="space-y-10">
            <div className="bg-white p-10 rounded-[40px] border border-slate-200/60 shadow-sm space-y-8">
               <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest border-b pb-4">Global Modifiers</h3>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax Percentage</label>
                     <div className="relative">
                        <Percent className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                           type="number"
                           className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                           value={taxRate}
                           onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Discount</label>
                     <div className="relative">
                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                           type="number"
                           className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                           value={discount}
                           onChange={(e) => setDiscount(parseFloat(e.target.value))}
                        />
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-blue-50 p-10 rounded-[40px] border border-blue-100 space-y-6">
               <div className="flex items-center gap-4 text-blue-600 mb-2">
                  <CheckCircle2 size={24} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Compliance Check</h3>
               </div>
               <p className="text-xs font-bold text-blue-800/60 leading-relaxed italic">"All fiscal documents are generated with tier-IV encryption and follow regional compliance protocols for enterprise SaaS architectures."</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default InvoiceBuilder;
