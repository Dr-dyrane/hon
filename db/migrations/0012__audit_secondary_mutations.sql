drop trigger if exists audit_page_section_presentations_change on app.page_section_presentations;
create trigger audit_page_section_presentations_change
after insert or update or delete on app.page_section_presentations
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_page_section_bindings_change on app.page_section_bindings;
create trigger audit_page_section_bindings_change
after insert or update or delete on app.page_section_bindings
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_review_requests_change on app.review_requests;
create trigger audit_review_requests_change
after insert or update or delete on app.review_requests
for each row
execute function audit.log_row_change('id');
