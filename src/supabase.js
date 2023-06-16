import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://";
const supabaseKey = "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
