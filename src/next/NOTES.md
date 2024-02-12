# Notes

- [ ] should NativeStatement.getColumnNames() also take a `database` argument? Otherwise we can't call `column_names` unless we also have a `database` member in Native statement. Alternatively we could expect the constructor of NativeStatement to take a `database` argument as I've done temporarily.
