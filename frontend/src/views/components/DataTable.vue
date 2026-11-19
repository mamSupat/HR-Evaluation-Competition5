<template>
  <section class="panel"><div class="section-head"><h2>รายการข้อมูล</h2><span class="muted">{{rows.length}} รายการ</span></div><div class="table-wrap"><table><thead><tr><th v-for="c in columns" :key="c.key">{{c.label}}</th><th v-if="showActions">จัดการ</th></tr></thead><tbody><tr v-for="r in rows" :key="r.user_id||r.round_id||r.indicator_id||r.duty_id"><td v-for="c in columns" :key="c.key">{{r[c.key]??'-'}}</td><td v-if="showActions" class="actions"><button class="btn small" @click="$emit('edit',r)">แก้ไข</button><button v-if="r.user_id" class="btn small light" @click="$emit('reset',r)">รีเซ็ตรหัส</button><button class="btn small danger" @click="$emit('remove',r)">{{r.user_id?'ปิดใช้':'ลบ'}}</button></td></tr><tr v-if="!rows.length"><td ::colspan="columns.length+(showActions?1:0)">ยังไม่มีข้อมูล</td></tr></tbody></table></div></section>
</template>
<script setup>
defineProps({rows:{type:Array,default:()=>[]},columns:{type:Array,default:()=>[]},showActions:{type:Boolean,default:true}})
defineEmits(['edit','remove','reset'])
</script>
